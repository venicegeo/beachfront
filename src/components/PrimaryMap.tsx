/**
 * Copyright 2017, Radiant Solutions
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

require('ol/ol.css')
const styles: any = require('./PrimaryMap.css')
const tileErrorPlaceholder: string = require('../images/tile-error.png')
const missingKeyPlaceholder: string = require('../images/tile-missing-key.png')

import * as React from 'react'
import {findDOMNode} from 'react-dom'
import Collection from 'ol/collection'
import LineString from 'ol/geom/linestring'
import Draw from 'ol/interaction/draw'
import VectorLayer from 'ol/layer/vector'
import proj from 'ol/proj'
import VectorSource from 'ol/source/vector'
import RegularShape from 'ol/style/regularshape'
import Stroke from 'ol/style/stroke'
import Style from 'ol/style/style'
import control from 'ol/control'
import FullScreen from 'ol/control/fullscreen'
import MousePosition from 'ol/control/mouseposition'
import ScaleLine from 'ol/control/scaleline'
import ZoomSlider from 'ol/control/zoomslider'
import coordinate from 'ol/coordinate'
import condition from 'ol/events/condition'
import extent from 'ol/extent'
import Feature from 'ol/feature'
import GeoJSON from 'ol/format/geojson'
import Geometry from 'ol/geom/geometry'
import MultiPolygon from 'ol/geom/multipolygon'
import Point from 'ol/geom/point'
import Polygon from 'ol/geom/polygon'
import interaction from 'ol/interaction'
import DragRotate from 'ol/interaction/dragrotate'
import Select from 'ol/interaction/select'
import Tile from 'ol/layer/tile'
import Map from 'ol/map'
import Overlay from 'ol/overlay'
import TileWMS from 'ol/source/tilewms'
import XYZ from 'ol/source/xyz'
import Fill from 'ol/style/fill'
import Text from 'ol/style/text'
import View from 'ol/view'
import Image from 'ol/layer/image'
import ImageStatic from 'ol/source/imagestatic'
import * as debounce from 'lodash/debounce'
import * as throttle from 'lodash/throttle'
import {ExportControl} from '../utils/openlayers.ExportControl'
import {SearchControl} from '../utils/openlayers.SearchControl'
import {MeasureControl} from '../utils/openlayers.MeasureControl'
import {ScaleControl} from '../utils/openlayers.ScaleControl'
import {BasemapSelect} from './BasemapSelect'
import {FeatureDetails} from './FeatureDetails'
import {LoadingAnimation} from './LoadingAnimation'
import {ImagerySearchResults} from './ImagerySearchResults'
import {normalizeSceneId} from './SceneFeatureDetails'
import {featureToExtent, deserializeBbox, serializeBbox, bboxToExtent, toGeoJSON} from '../utils/geometries'
import {
  BASEMAP_TILE_PROVIDERS,
  SCENE_TILE_PROVIDERS,
} from '../config'
import {
  STATUS_ACTIVE,
  STATUS_ERROR,
  STATUS_FAIL,
  STATUS_INACTIVE,
  STATUS_PENDING,
  STATUS_ACTIVATING,
  STATUS_RUNNING,
  STATUS_SUCCESS,
  STATUS_TIMED_OUT,
  STATUS_CANCELLED,
  TYPE_SCENE,
  TYPE_JOB,
} from '../constants'

const DEFAULT_CENTER: [number, number] = [-10, 0]
const MIN_ZOOM = 2.5
const MAX_ZOOM = 22
const RESOLUTION_CLOSE = 850
const VIEW_BOUNDS: [number, number, number, number] = [-170, -75, 170, 75]
const STEM_OFFSET = 10000
const IDENTIFIER_DETECTIONS = 'piazza:bfdetections'
const KEY_SCENE_ID = 'SCENE_ID'
const KEY_LAYERS = 'LAYERS'
const KEY_NAME = 'name'
const KEY_OWNER_ID = 'OWNER_ID'
const KEY_STATUS = 'status'
const KEY_TYPE = 'type'
const KEY_ENV = 'env'
const TYPE_DIVOT_INBOARD = 'DIVOT_INBOARD'
const TYPE_DIVOT_OUTBOARD = 'DIVOT_OUTBOARD'
const TYPE_LABEL_MAJOR = 'LABEL_MAJOR'
const TYPE_LABEL_MINOR = 'LABEL_MINOR'
const TYPE_STEM = 'STEM'
const WGS84 = 'EPSG:4326'
const WEB_MERCATOR = 'EPSG:3857'
export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
export const MODE_PRODUCT_LINES = 'MODE_PRODUCT_LINES'
export const MODE_SELECT_IMAGERY = 'MODE_SELECT_IMAGERY'

interface Props {
  bbox: number[]
  catalogApiKey:      string
  detections:         (beachfront.Job | beachfront.ProductLine)[]
  frames:             (beachfront.Job | beachfront.ProductLine)[]
  highlightedFeature: beachfront.Job
  imagery:            beachfront.ImageryCatalogPage
  isSearching:        boolean
  mode:               string
  selectedFeature:    beachfront.Job | beachfront.Scene
  view:               MapView
  wmsUrl:             string
  shrunk:             boolean
  onBoundingBoxChange(bbox: number[])
  onMapInitialization(collections: any)
  onSearchPageChange(page: {count: number, startIndex: number})
  onSelectFeature(feature: beachfront.Job | beachfront.Scene)
  onViewChange(view: MapView)
  logout()
}

interface State {
  basemapIndex?: number
  isMeasuring?: boolean
  loadingRefCount?: number
  tileLoadError?: boolean
}

export interface MapView {
  basemapIndex: number
  center: [number, number]
  zoom: number
}

export class PrimaryMap extends React.Component<Props, State> {
  refs: any

  private basemapLayers: Tile[]
  private bboxDrawInteraction: Draw
  private detectionsLayers: {[key: string]: Tile}
  private drawLayer: VectorLayer
  private featureDetailsOverlay: Overlay
  private featureId?: number | string
  private frameLayer: VectorLayer
  private highlightLayer: VectorLayer
  private hoverInteraction: Select
  private imageSearchResultsOverlay: Overlay
  private imageryLayer: VectorLayer
  private map: Map
  private previewLayers: {[key: string]: Tile}
  private selectInteraction: Select
  private skipNextViewUpdate: boolean

  constructor() {
    super()
    this.state = {basemapIndex: 0, loadingRefCount: 0}
    this.emitViewChange = debounce(this.emitViewChange.bind(this), 100)
    this.handleBasemapChange = this.handleBasemapChange.bind(this)
    this.handleDrawEnd = this.handleDrawEnd.bind(this)
    this.handleDrawStart = this.handleDrawStart.bind(this)
    this.handleLoadError = this.handleLoadError.bind(this)
    this.handleLoadStart = this.handleLoadStart.bind(this)
    this.handleLoadStop = this.handleLoadStop.bind(this)
    this.handleMeasureEnd = this.handleMeasureEnd.bind(this)
    this.handleMeasureStart = this.handleMeasureStart.bind(this)
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 15)
    this.handleSelect = this.handleSelect.bind(this)
    this.handleSelectFeature = this.handleSelectFeature.bind(this)
    this.renderImagerySearchBbox = debounce(this.renderImagerySearchBbox.bind(this))
    this.updateView = debounce(this.updateView.bind(this), 100)
  }

  componentDidMount() {
    this.initializeOpenLayers()
    this.renderSelectionPreview()
    this.renderDetections()
    this.renderFrames()
    this.renderImagery()
    this.renderImagerySearchResultsOverlay()
    this.updateView()

    if (this.props.bbox) {
      this.renderImagerySearchBbox()
    }

    this.updateInteractions()

    if (this.props.selectedFeature) {
      this.updateSelectedFeature()
    }

    // Used by tests
    window['primaryMap'] = this  // tslint:disable-line

    if (this.props.onMapInitialization) {
      this.props.onMapInitialization({
        hovered: this.hoverInteraction.getFeatures(),
        imagery: this.imageryLayer.getSource().getFeaturesCollection(),
        selected: this.selectInteraction.getFeatures(),
        handleSelectFeature: this.handleSelectFeature,
      })
    }
  }

  componentDidUpdate(previousProps: Props, previousState: State) {
    if (!this.props.selectedFeature) {
      this.clearSelection()
    }

    if (previousProps.selectedFeature !== this.props.selectedFeature) {
      this.renderSelectionPreview()
      this.updateSelectedFeature()
    }

    if (previousProps.detections !== this.props.detections) {
      this.renderDetections()
    }

    if (previousProps.highlightedFeature !== this.props.highlightedFeature) {
      this.renderHighlight()
    }

    if (previousProps.frames !== this.props.frames) {
      this.renderFrames()
    }

    if (previousProps.imagery !== this.props.imagery) {
      this.renderImagery()
    }

    if (previousProps.isSearching !== this.props.isSearching) {
      this.clearSelection()
      this.renderImagerySearchResultsOverlay()
    }

    if (previousProps.shrunk !== this.props.shrunk) {
      this.updateMapSize()
    }

    if (previousProps.bbox !== this.props.bbox) {
      this.renderImagerySearchBbox()
    }

    if (previousState.basemapIndex !== this.state.basemapIndex) {
      this.updateBasemap()
    }

    if (previousProps.view !== this.props.view && this.props.view) {
      this.updateView()
    }

    if ((previousProps.mode !== this.props.mode) ||
      (previousState.isMeasuring !== this.state.isMeasuring)) {
      this.updateInteractions()
    }
  }

  render() {
    return (
      <main
        className={`${styles.root} ${this.props.shrunk ? styles.notHome : styles.home} ${this.state.loadingRefCount ? styles.isLoading : ''}`}
        ref="container"
        tabIndex={1}
      >
        <div className={styles.logout}><a onClick={this.props.logout}>Sign Out</a></div>
        <BasemapSelect
          className={styles.basemapSelect}
          index={this.state.basemapIndex}
          basemaps={BASEMAP_TILE_PROVIDERS.map(b => b.name)}
          onChange={this.handleBasemapChange}
        />
        <FeatureDetails
          ref="featureDetails"
          feature={this.props.selectedFeature}
        />
        <ImagerySearchResults
          ref="imageSearchResults"
          imagery={this.props.imagery}
          isSearching={this.props.isSearching}
          onPageChange={this.props.onSearchPageChange}
        />
        <LoadingAnimation
          className={styles.loadingIndicator}
        />
      </main>
    )
  }

  handleHoverScene(feature_or_id: string | beachfront.Scene) {
    const feature: any = typeof feature_or_id === 'string'
      ? this.imageryLayer.getSource().getFeatureById(feature_or_id)
      : feature_or_id
    const collection = this.hoverInteraction.getFeatures()

    collection.clear()

    if (feature) {
      collection.push(feature)
    }
  }

  handleSelectFeature(feature_or_id) {
    const feature: any = typeof feature_or_id === 'string'
      ? this.imageryLayer.getSource().getFeatureById(feature_or_id)
      : feature_or_id

    switch (feature ? feature.get(KEY_TYPE) : null) {
      case TYPE_DIVOT_INBOARD:
      case TYPE_DIVOT_OUTBOARD:
      case TYPE_STEM:
        // Proxy clicks on "inner" decorations out to the job frame itself
        this.featureId = feature.ol_uid
        const jobId = feature.get(KEY_OWNER_ID)
        const jobFeature = this.frameLayer.getSource().getFeatureById(jobId)
        const selections = this.selectInteraction.getFeatures()
        selections.clear()
        selections.push(jobFeature)
        this.props.onSelectFeature(toGeoJSON(jobFeature) as beachfront.Job)
        break
      case TYPE_JOB:
      case TYPE_SCENE:
        this.featureId = feature.ol_uid
        this.props.onSelectFeature(toGeoJSON(feature) as beachfront.Scene)
        break
      default:
        // Not a valid "selectable" feature
        this.featureId = null
        this.clearSelection()
        this.emitDeselectAll()
        break
    }
  }

  //
  // Internals
  //

  private activateBboxDrawInteraction() {
    this.bboxDrawInteraction.setActive(true)
  }

  private activateHoverInteraction() {
    this.hoverInteraction.setActive(true)
  }

  private activateSelectInteraction() {
    this.selectInteraction.setActive(true)
  }

  private clearDraw() {
    this.drawLayer.getSource().clear()
  }

  private clearFrames() {
    this.frameLayer.getSource().clear()
  }

  private clearSelection() {
    this.selectInteraction.getFeatures().clear()
  }

  private updateMapSize() {
    this.map.updateSize()
  }

  private deactivateBboxDrawInteraction() {
    this.bboxDrawInteraction.setActive(false)
  }

  private deactivateHoverInteraction(clear = true) {
    if (clear) {
      this.hoverInteraction.getFeatures().clear()
    }

    this.hoverInteraction.setActive(false)
  }

  private deactivateSelectInteraction(skipReset = false) {
    if (!skipReset) {
      this.clearSelection()
      this.emitDeselectAll()
    }
    this.selectInteraction.setActive(false)
  }

  private emitViewChange() {
    const view = this.map.getView()
    const {basemapIndex} = this.state
    const center = proj.transform(view.getCenter(), WEB_MERCATOR, WGS84)
    const zoom = view.getZoom() || MIN_ZOOM  // HACK -- sometimes getZoom returns undefined...

    // Don't emit false positives
    if (!this.props.view
      || this.props.view.center[0] !== center[0]
      || this.props.view.center[1] !== center[1]
      || this.props.view.zoom !== zoom
      || this.props.view.basemapIndex !== basemapIndex
    ) {
      this.skipNextViewUpdate = true
      this.props.onViewChange({ basemapIndex, center, zoom })
    }
  }

  private emitDeselectAll() {
    this.props.onSelectFeature(null)
  }

  private handleBasemapChange(index) {
    this.setState({basemapIndex: index})
    this.emitViewChange()
  }

  private handleDrawEnd(event) {
    const geometry = event.feature.getGeometry()
    const bbox = serializeBbox(geometry.getExtent())

    this.props.onBoundingBoxChange(bbox)
  }

  private handleDrawStart() {
    this.clearDraw()
    this.props.onBoundingBoxChange(null)
  }

  private handleMeasureEnd() {
    this.setState({ isMeasuring: false })
  }

  private handleMeasureStart() {
    this.setState({ isMeasuring: true })
  }

  private handleLoadError(event) {
    const tile = event.tile

    this.setState({ loadingRefCount: Math.max(0, this.state.loadingRefCount - 1) })

    if (!tile.loadingError) {
      tile.loadingError = true
      tile.load()
    }
  }

  private handleLoadStart() {
    this.setState({ loadingRefCount: this.state.loadingRefCount + 1 })
  }

  private handleLoadStop() {
    this.setState({ loadingRefCount: Math.max(0, this.state.loadingRefCount - 1) })
  }

  private handleMouseMove(event) {
    if (this.state.isMeasuring) {
      this.refs.container.classList.remove(styles.isHoveringFeature)
      return
    }

    let foundFeature = false
    this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      switch (feature.get(KEY_TYPE)) {
        case TYPE_DIVOT_INBOARD:
        case TYPE_JOB:
        case TYPE_SCENE:
          foundFeature = true
          return true
      }
    }, { layerFilter: l => l === this.frameLayer || l === this.imageryLayer })

    if (foundFeature) {
      this.refs.container.classList.add(styles.isHoveringFeature)
    } else {
      this.refs.container.classList.remove(styles.isHoveringFeature)
    }
  }

  private handleSelect(event) {
    if (event.selected.length || event.deselected.length) {
      let index = event.selected.findIndex(f => f.ol_uid === this.featureId) + 1

      if (!event.mapBrowserEvent.pointerEvent.shiftKey) {
        index += event.selected.length - (index ? 2 : 1)
      }

      this.handleSelectFeature(event.selected[index % event.selected.length])
    }
  }

  private initializeOpenLayers() {
    this.basemapLayers = generateBasemapLayers(BASEMAP_TILE_PROVIDERS)
    this.drawLayer = generateDrawLayer()
    this.highlightLayer = generateHighlightLayer()
    this.frameLayer = generateFrameLayer()
    this.imageryLayer = generateImageryLayer()
    this.detectionsLayers = {}
    this.previewLayers = {}

    this.bboxDrawInteraction = generateBboxDrawInteraction(this.drawLayer)
    this.bboxDrawInteraction.on('drawstart', this.handleDrawStart)
    this.bboxDrawInteraction.on('drawend', this.handleDrawEnd)

    this.hoverInteraction = generateHoverInteraction(this.imageryLayer)

    this.selectInteraction = generateSelectInteraction(this.frameLayer, this.imageryLayer)
    this.selectInteraction.on('select', this.handleSelect)

    this.featureDetailsOverlay = generateFeatureDetailsOverlay(this.refs.featureDetails)
    this.imageSearchResultsOverlay = generateImageSearchResultsOverlay(this.refs.imageSearchResults)

    this.map = new Map({
      controls: generateControls(),
      interactions: generateBaseInteractions().extend([
        this.bboxDrawInteraction,
        this.selectInteraction,
        this.hoverInteraction,
      ]),
      layers: [
        // Order matters here
        ...this.basemapLayers,
        this.frameLayer,
        this.drawLayer,
        this.imageryLayer,
        this.highlightLayer,
      ],
      target: this.refs.container,
      view: new View({
        center: proj.fromLonLat(DEFAULT_CENTER, WEB_MERCATOR),
        extent: proj.transformExtent(VIEW_BOUNDS, WGS84, WEB_MERCATOR),
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        zoom: MIN_ZOOM,
      }),
    })

    /*
      2016-08-22 -- Due to internal implementation of the 'autoPan' option,
          overlays that will be immediately visible cannot be added to a map
          instance until the instance has been fully rendered first.

          Reference:
              https://github.com/openlayers/ol3/issues/5456
    */
    this.map.renderSync()
    this.map.addOverlay(this.imageSearchResultsOverlay)
    this.map.addOverlay(this.featureDetailsOverlay)

    this.map.on('pointermove', this.handleMouseMove)
    this.map.on('moveend', this.emitViewChange)

    this.map.on('measure:start', this.handleMeasureStart)
    this.map.on('measure:end', this.handleMeasureEnd)
  }

  private updateView() {
    if (this.skipNextViewUpdate) {
      this.skipNextViewUpdate = false
      return
    }

    if (!this.props.view) {
      return
    }

    const {basemapIndex, zoom, center} = this.props.view
    this.setState({ basemapIndex })
    const view = this.map.getView()

    view.animate({
      center: view.constrainCenter(proj.transform(center, WGS84, WEB_MERCATOR)),
      duration: 2000,
      zoom: zoom,
    })
  }

  private renderDetections() {
    const {detections, wmsUrl} = this.props
    const shouldRender = {}
    const alreadyRendered = {}

    detections.forEach(d => shouldRender[d.id] = true)

    // Removals
    Object.keys(this.detectionsLayers).forEach(layerId => {
      const layer = this.detectionsLayers[layerId]

      alreadyRendered[layerId] = true

      if (!shouldRender[layerId]) {
        delete this.detectionsLayers[layerId]
        animateLayerExit(layer).then(() => { this.map.removeLayer(layer) })
      }
    })

    // Additions/Updates
    const insertionIndex = this.map.getLayers().getArray().indexOf(this.frameLayer)
    detections.filter(d => shouldRender[d.id] && !alreadyRendered[d.id]).forEach(detection => {
      const layer = new Tile({
        extent: featureToExtent(detection),
        source: generateDetectionsSource(wmsUrl, detection),
      })

      this.subscribeToLoadEvents(layer)
      this.detectionsLayers[detection.id] = layer
      this.map.getLayers().insertAt(insertionIndex, layer)
    })
  }

  private renderFrames() {
    this.clearFrames()

    const source = this.frameLayer.getSource()
    const reader = new GeoJSON()

    this.props.frames.forEach(raw => {
      const frame = reader.readFeature(raw, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      source.addFeature(frame)

      const frameExtent = calculateExtent(frame.getGeometry())
      const topRight = extent.getTopRight(extent.buffer(frameExtent, STEM_OFFSET))
      const center = extent.getCenter(frameExtent)
      const id = frame.getId()

      const stem = new Feature({
        geometry: new LineString([
          center,
          topRight,
        ]),
      })

      stem.set(KEY_TYPE, TYPE_STEM)
      stem.set(KEY_OWNER_ID, id)
      source.addFeature(stem)

      const divotInboard = new Feature({ geometry: new Point(center) })
      divotInboard.set(KEY_TYPE, TYPE_DIVOT_INBOARD)
      divotInboard.set(KEY_OWNER_ID, id)
      source.addFeature(divotInboard)

      const divotOutboard = new Feature({ geometry: new Point(topRight) })
      divotOutboard.set(KEY_TYPE, TYPE_DIVOT_OUTBOARD)
      divotOutboard.set(KEY_OWNER_ID, id)
      divotOutboard.set(KEY_STATUS, raw.properties.status)
      source.addFeature(divotOutboard)

      const name = new Feature({ geometry: new Point(topRight) })
      name.set(KEY_TYPE, TYPE_LABEL_MAJOR)
      name.set(KEY_OWNER_ID, id)
      name.set(KEY_NAME, raw.properties.name.toUpperCase())
      source.addFeature(name)

      const status = new Feature({ geometry: new Point(topRight) })
      status.set(KEY_TYPE, TYPE_LABEL_MINOR)
      status.set(KEY_OWNER_ID, id)
      status.set(KEY_STATUS, raw.properties.status)
      status.set(KEY_SCENE_ID, (raw as beachfront.Job).properties.scene_id)
      status.set(KEY_NAME, (raw as beachfront.Job).properties.name)
      source.addFeature(status)
    })
  }

  private renderHighlight() {
    const source = this.highlightLayer.getSource()
    source.clear()

    const geojson = this.props.highlightedFeature
    if (!geojson) {
      return
    }

    const reader = new GeoJSON()
    const feature = reader.readFeature(geojson, {
      dataProjection: WGS84,
      featureProjection: WEB_MERCATOR,
    })

    source.addFeature(feature)
  }

  private renderImagery() {
    const {imagery} = this.props
    const reader = new GeoJSON()
    const source = this.imageryLayer.getSource()

    source.setAttributions(undefined)
    source.clear()

    if (imagery) {
      const features = reader.readFeatures(imagery.images, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      if (features.length) {
        features.forEach(feature => {feature.set(KEY_TYPE, TYPE_SCENE)})
        source.addFeatures(features)
      }
    }
  }

  private renderImagerySearchResultsOverlay() {
    this.imageSearchResultsOverlay.setPosition(undefined)

    // HACK HACK HACK HACK HACK HACK HACK HACK
    const bbox = deserializeBbox(this.props.bbox)
    if (!bbox) {
      return  // Nothing to pin the overlay to
    }

    if (!this.props.imagery || this.props.isSearching) {
      return  // No results are in
    }

    if (this.props.imagery.count) {
      // Pager
      this.imageSearchResultsOverlay.setPosition(extent.getBottomRight(bbox))
      this.imageSearchResultsOverlay.setPositioning('top-right')
    } else {
      // No results
      this.imageSearchResultsOverlay.setPosition(extent.getCenter(bbox))
      this.imageSearchResultsOverlay.setPositioning('center-center')
    }
    // HACK HACK HACK HACK HACK HACK HACK HACK
  }

  private renderImagerySearchBbox() {
    this.clearDraw()
    const bbox = deserializeBbox(this.props.bbox)
    if (!bbox) {
      return
    }

    const feature = new Feature({ geometry: Polygon.fromExtent(bbox) })
    this.drawLayer.getSource().addFeature(feature)
  }

  private renderSelectionPreview() {
    const previewables = toPreviewable([this.props.selectedFeature].filter(Boolean))
    const shouldRender = {}
    const alreadyRendered = {}

    previewables.forEach(i => shouldRender[i.sceneId] = true)

    // Removals
    Object.keys(this.previewLayers).forEach(imageId => {
      const layer = this.previewLayers[imageId]

      alreadyRendered[imageId] = true
      if (!shouldRender[imageId]) {
        delete this.previewLayers[imageId]
        animateLayerExit(layer).then(() => { this.map.removeLayer(layer) })
      }
    })

    // Additions
    const insertionIndex = this.basemapLayers.length
    previewables
      .filter(f => shouldRender[f.sceneId] && !alreadyRendered[f.sceneId])
      .forEach(f => {
        const chunks = f.sceneId.match(/^(\w+):(.*)$/)
        if (!chunks) {
          console.warn('(@primaryMap._renderSelectionPreview) Invalid scene ID: `%s`', f.sceneId)
          return
        }

        const [, prefix, externalId] = chunks
        const provider = SCENE_TILE_PROVIDERS.find(p => p.prefix === prefix)
        if (!provider) {
          console.warn('(@primaryMap._renderSelectionPreview) No provider available for scene `%s`', f.sceneId)
          return
        }

        const {catalogApiKey} = this.props
        let layer: Tile

        if (provider.isXYZProvider) {
          layer = new Tile({
            extent: f.extent,
            source: generateXYZScenePreviewSource(provider, externalId, catalogApiKey),
          })
        } else {
          layer = new Image({
            source: generateImageStaticScenePreviewSource(provider, externalId, f.extent, catalogApiKey),
          })
        }

        console.log('Created preview layer', layer)

        this.subscribeToLoadEvents(layer)
        this.previewLayers[f.sceneId] = layer
        this.map.getLayers().insertAt(insertionIndex, layer)
      })
    }

  private subscribeToLoadEvents(layer) {
    const source = layer.getSource()
    source.on('tileloadstart', this.handleLoadStart)
    source.on('tileloadend', this.handleLoadStop)
    source.on('tileloaderror', this.handleLoadError)
  }

  private updateBasemap() {
    this.basemapLayers.forEach((layer, i) => layer.setVisible(i === this.state.basemapIndex))
  }

  private updateInteractions() {
    if (this.state.isMeasuring) {
      this.deactivateBboxDrawInteraction()
      this.deactivateSelectInteraction(true)
      this.deactivateHoverInteraction(false)
      return
    }

    switch (this.props.mode) {
      case MODE_SELECT_IMAGERY:
        this.deactivateBboxDrawInteraction()
        this.activateSelectInteraction()
        this.activateHoverInteraction()
        break
      case MODE_DRAW_BBOX:
        this.activateBboxDrawInteraction()
        this.deactivateSelectInteraction()
        this.deactivateHoverInteraction()
        break
      case MODE_NORMAL:
        /* this.clearDraw() TODO: Okay? */
        this.deactivateBboxDrawInteraction()
        this.activateSelectInteraction()
        this.deactivateHoverInteraction()
        break
      case MODE_PRODUCT_LINES:
        /* this.clearDraw() TODO: Okay? */
        this.deactivateBboxDrawInteraction()
        this.activateSelectInteraction()
        this.deactivateHoverInteraction()
        break
      default:
        console.warn('wat mode=%s', this.props.mode)
        break
    }
  }

  private updateSelectedFeature() {
    const features = this.selectInteraction.getFeatures()
    features.clear()

    const {selectedFeature} = this.props
    if (!selectedFeature) {
      return  // Nothing to do
    }

    const reader = new GeoJSON()
    const feature = reader.readFeature(selectedFeature, {
      dataProjection: WGS84,
      featureProjection: WEB_MERCATOR,
    })
    const center = extent.getCenter(calculateExtent(feature.getGeometry()))
    features.push(feature)
    this.featureDetailsOverlay.setPosition(center)
  }
}

function animateLayerExit(layer) {
  return new Promise(resolve => {
    const step = 0.075
    let opacity = 1

    const tick = () => {
      if (opacity > 0) {
        opacity -= step
        layer.setOpacity(opacity)
        requestAnimationFrame(tick)
      } else {
        resolve(layer)
      }
    }

    requestAnimationFrame(tick)
  })
}

function calculateExtent(geometry: Geometry) {
  if (geometry instanceof MultiPolygon && crossesDateline(geometry)) {
    const extents = geometry.getPolygons().map(g => proj.transformExtent(g.getExtent(), WEB_MERCATOR, WGS84))
    let [, minY, , maxY] = proj.transformExtent(geometry.getExtent(), WEB_MERCATOR, WGS84)
    let width = 0
    let minX = 180

    for (const [polygonMinX, , polygonMaxX] of extents) {
      width += polygonMaxX - polygonMinX

      if (polygonMaxX > 0) {
        minX -= polygonMaxX - polygonMinX
      }
    }

    return proj.transformExtent([minX, minY, minX + width, maxY], WGS84, WEB_MERCATOR)
  }

  return geometry.getExtent()  // Use as-is
}

function crossesDateline(geometry: Geometry) {
  const [minX, , maxX] = proj.transformExtent(geometry.getExtent(), WEB_MERCATOR, WGS84)
  return minX === -180 && maxX === 180
}

function generateBasemapLayers(providers) {
  return providers.map((provider, index) => {
    const source = new XYZ(Object.assign({}, provider, {
      crossOrigin: 'anonymous',
      tileLoadFunction,
    }))
    const layer = new Tile({source})

    layer.setProperties({ name: provider.name, visible: index === 0 })

    return layer
  })
}

function generateBaseInteractions() {
  return interaction.defaults().extend([
    new DragRotate({
      condition: condition.altKeyOnly,
    }),
  ])
}

function generateControls() {
  return control.defaults({
    attributionOptions: {
      collapsible: false,
    },
  }).extend([
    new ScaleLine({
      minWidth: 250,
      units: 'nautical',
    }),
    new ZoomSlider(),
    new MousePosition({
      coordinateFormat: coordinate.toStringHDMS,
      projection: WGS84,
    }),
    new FullScreen(),
    new ExportControl(styles.export),
    new SearchControl(styles.search),
    new MeasureControl(styles.measure),
    new ScaleControl(styles.scale),
  ])
}

function generateDetectionsSource(wmsUrl, feature: beachfront.Job|beachfront.ProductLine) {
  return new TileWMS({
    tileLoadFunction: detectionTileLoadFunction,
    crossOrigin: 'anonymous',
    url: wmsUrl,
    projection: WEB_MERCATOR,
    params: {
      [KEY_LAYERS]: IDENTIFIER_DETECTIONS,
      [KEY_ENV]: (feature.properties.type === TYPE_JOB ? 'jobid:' : 'productlineid:') + feature.id,  // HACK
    },
  })
}

function generateDrawLayer() {
  return new VectorLayer({
    source: new VectorSource({
      wrapX: false,
    }),
    style: new Style({
      fill: new Fill({
        color: 'hsla(202, 70%, 50%, 0.35)',
      }),
      stroke: new Stroke({
        color: 'hsla(202, 70%, 50%, 0.7)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })
}

function generateBboxDrawInteraction(drawLayer) {
  const draw = new Draw({
    source: drawLayer.getSource(),
    maxPoints: 2,
    type: 'LineString',
    geometryFunction(coordinates: any, geometry: Polygon) {
      if (!geometry) {
        geometry = new Polygon(null)
      }
      const [[x1, y1], [x2, y2]] = coordinates
      geometry.setCoordinates([[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]])
      return geometry
    },
    style: new Style({
      image: new RegularShape({
        stroke: new Stroke({
          color: 'black',
          width: 1,
        }),
        points: 4,
        radius: 15,
        radius2: 0,
        angle: 0,
      }),
      fill: new Fill({
        color: 'hsla(202, 70%, 50%, .6)',
      }),
      stroke: new Stroke({
        color: 'hsl(202, 70%, 50%)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })

  draw.setActive(false)

  return draw
}

function generateFeatureDetailsOverlay(componentRef) {
  return new Overlay({
    autoPan:     true,
    element:     findDOMNode(componentRef),
    id:          'featureDetails',
    positioning: 'top-left',
  })
}

function generateFrameLayer() {
  return new VectorLayer({
    source: new VectorSource(),
    style(feature: Feature, resolution: number) {
      const isClose = resolution < RESOLUTION_CLOSE

      switch (feature.get(KEY_TYPE)) {
        case TYPE_DIVOT_INBOARD:
          return new Style({
            image: new RegularShape({
              angle: Math.PI / 4,
              points: 4,
              radius: 5,
              fill: new Fill({
                color: 'black',
              }),
            }),
          })
        case TYPE_DIVOT_OUTBOARD:
          return new Style({
            image: new RegularShape({
              angle: Math.PI / 4,
              points: 4,
              radius: 10,
              stroke: new Stroke({
                color: 'black',
                width: 1,
              }),
              fill: new Fill({
                color: getColorForStatus(feature.get(KEY_STATUS)),
              }),
            }),
          })
        case TYPE_STEM:
          return new Style({
            stroke: new Stroke({
              color: 'black',
              width: 1,
            }),
          })
        case TYPE_LABEL_MAJOR:
          return new Style({
            text: new Text({
              fill: new Fill({
                color: isClose ? 'black' : 'transparent',
              }),
              offsetX: 13,
              offsetY: 1,
              font: 'bold 17px Catamaran, Verdana, sans-serif',
              text: feature.get(KEY_NAME).toUpperCase(),
              textAlign: 'left',
              textBaseline: 'middle',
            }),
          })
        case TYPE_LABEL_MINOR:
          const name = feature.get(KEY_NAME)
          const sceneId = normalizeSceneId(feature.get(KEY_SCENE_ID))

          return new Style({
            text: new Text({
              fill: new Fill({
                color: isClose ? 'rgba(0,0,0,.6)' : 'transparent',
              }),
              offsetX: 13,
              offsetY: 15,
              font: '11px Verdana, sans-serif',
              text: ([
                feature.get(KEY_STATUS),
                sceneId !== name ? sceneId : null,
              ].filter(Boolean)).join(' // ').toUpperCase(),
              textAlign: 'left',
              textBaseline: 'middle',
            }),
          })
        default:
          return new Style({
            stroke: new Stroke({
              color: 'rgba(0, 0, 0, .4)',
              lineDash: [10, 10],
            }),
            fill: new Fill({
              color: isClose ? 'transparent' : 'hsla(202, 100%, 85%, 0.5)',
            }),
          })
      }
    },
  })
}

function generateHighlightLayer() {
  return new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      fill: new Fill({
        color: 'hsla(90, 100%, 30%, .5)',
      }),
      stroke: new Stroke({
        color: 'hsla(90, 100%, 30%, .6)',
      }),
    }),
  })
}

function generateHoverInteraction(...layers) {
  return new Select({
    layers,
    multi: true,
    condition: e => condition.pointerMove(e) && condition.noModifierKeys(e),
    style: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.12)',
      }),
      stroke: new Stroke({
        color: 'hsla(200, 70%, 90%, 0.8)',
        width: 4,
      }),
    }),
  })
}

function generateImageryLayer() {
  return new VectorLayer({
    source: new VectorSource({ features: new Collection() }),
    style: new Style({
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.08)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.32)',
        width: 1,
      }),
    }),
  })
}

function generateImageSearchResultsOverlay(componentRef) {
  return new Overlay({
    autoPan:   true,
    element:   findDOMNode(componentRef),
    id:        'imageSearchResults',
    stopEvent: false,
  })
}

function generateXYZScenePreviewSource(provider, imageId, apiKey) {
  return new XYZ(Object.assign({}, provider, {
    crossOrigin: 'anonymous',
    tileLoadFunction,
    url: provider.url.replace('__SCENE_ID__', imageId).replace('__API_KEY__', apiKey),
  }))
}

function generateImageStaticScenePreviewSource(provider, imageId, extent, apiKey) {
  return new ImageStatic(Object.assign({}, provider, {
    crossOrigin: 'anonymous',
    imageLoadFunction: tileLoadFunction,
    projection: WEB_MERCATOR,
    url: provider.url.replace('__SCENE_ID__', imageId).replace('__API_KEY__', apiKey),
    imageExtent: extent,
  }))
}

function generateSelectInteraction(...layers) {
  return new Select({
    layers,
    multi: true,
    condition: e => condition.click(e) && (
      condition.noModifierKeys(e) || condition.shiftKeyOnly(e)
    ),
    style: new Style({
      stroke: new Stroke({
        color: 'black',
        width: 2,
      }),
    }),
    toggleCondition: condition.never,
  })
}

function getColorForStatus(status) {
  switch (status) {
    case STATUS_ACTIVE: return 'hsl(200, 94%, 54%)'
    case STATUS_ACTIVATING: return 'hsl(300, 100%, 74%)'
    case STATUS_INACTIVE: return 'hsl(0, 0%, 50%)'
    case STATUS_PENDING:
    case STATUS_RUNNING: return 'hsl(48, 94%, 54%)'
    case STATUS_SUCCESS: return 'hsl(114, 100%, 45%)'
    case STATUS_TIMED_OUT:
    case STATUS_FAIL:
    case STATUS_ERROR: return 'hsl(349, 100%, 60%)'
    case STATUS_CANCELLED: return 'hsl(0, 0%, 70%)'
    default: return 'magenta'
  }
}

function toPreviewable(features: Array<beachfront.Job|beachfront.Scene>) {
  return features.map(f => ({
    sceneId: f.properties.type === TYPE_JOB ? f.properties.scene_id : f.id,
    extent: featureToExtent(f),
  }))
}

function getPlaceholder() {
  let placeholder = ''
  if (localStorage.getItem('catalog_apiKey')) {
    placeholder = tileErrorPlaceholder
  } else {
    placeholder = missingKeyPlaceholder
  }
  return placeholder
}

function tileLoadFunction(imageTile, src) {
  if (imageTile.loadingError) {
    delete imageTile.loadingError
    imageTile.getImage().src = getPlaceholder()
  } else {
    imageTile.getImage().src = src
  }
}

function detectionTileLoadFunction(imageTile, src) {
  if (imageTile.loadingError) {
    delete imageTile.loadingError
    imageTile.getImage().src = getPlaceholder()
  } else {
    const client = new XMLHttpRequest()
    client.open('GET', src)
    client.withCredentials = true
    client.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    const apiKey = getCookie('api_key')
    const auth = 'Basic ' + btoa(apiKey + ':')
    client.setRequestHeader('Authorization', auth)
    client.responseType = 'arraybuffer'
    client.onload = function() {
      const arrayBufferView = new Uint8Array(client.response)
      const blob = new Blob([arrayBufferView], { type: 'image/png' })
      const urlCreator = window.URL
      const imageUrl = urlCreator.createObjectURL(blob)
      imageTile.getImage().src = imageUrl
    }
    client.send()
  }
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp(name + '=([^;]+)'))
  if (match) {
    return match[1]
  }
  return null
}
