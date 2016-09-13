/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
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

require('openlayers/dist/ol.css')
const styles: any = require('./PrimaryMap.css')
const tileErrorPlaceholder: string = require('../images/tile-error.png')

import * as React from 'react'
import {findDOMNode} from 'react-dom'
import * as ol from 'openlayers'
import debounce = require('lodash/debounce')
import throttle = require('lodash/throttle')
import ExportControl from '../utils/openlayers.ExportControl'
import SearchControl from '../utils/openlayers.SearchControl'
import BasemapSelect from './BasemapSelect'
import FeatureDetails from './FeatureDetails'
import {LoadingAnimation} from './LoadingAnimation'
import ImagerySearchResults from './ImagerySearchResults'
import {featureToBbox, deserializeBbox, serializeBbox} from '../utils/geometries'
import {
  TILE_PROVIDERS,
  SCENE_TILE_PROVIDERS,
} from '../config'
import {
  STATUS_ACTIVE,
  STATUS_ERROR,
  STATUS_INACTIVE,
  STATUS_RUNNING,
  STATUS_SUCCESS,
  STATUS_TIMED_OUT,
  TYPE_SCENE,
  TYPE_JOB,
} from '../constants'

const DEFAULT_CENTER = [110, 0]
const MIN_ZOOM = 2.5
const MAX_ZOOM = 22
const RESOLUTION_CLOSE = 1000
const STEM_OFFSET = 10000
const KEY_IMAGE_ID = 'imageId'
const KEY_LAYERS = 'LAYERS'
const KEY_NAME = 'name'
const KEY_OWNER_ID = 'OWNER_ID'
const KEY_STATUS = 'status'
const KEY_TYPE = 'type'
const TYPE_DIVOT_INBOARD = 'DIVOT_INBOARD'
const TYPE_DIVOT_OUTBOARD = 'DIVOT_OUTBOARD'
const TYPE_LABEL_MAJOR = 'LABEL_MAJOR'
const TYPE_LABEL_MINOR = 'LABEL_MINOR'
const TYPE_STEM = 'STEM'
const WGS84: ol.proj.ProjectionLike = 'EPSG:4326'
const WEB_MERCATOR: ol.proj.ProjectionLike = 'EPSG:3857'
export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
export const MODE_PRODUCT_LINES = 'MODE_PRODUCT_LINES'
export const MODE_SELECT_IMAGERY = 'MODE_SELECT_IMAGERY'

interface Props {
  bbox: number[]
  catalogApiKey: string
  detections: (beachfront.Job|beachfront.ProductLine)[]
  frames: (beachfront.Job|beachfront.ProductLine)[]
  geoserverUrl: string
  highlightedFeature: beachfront.Job
  imagery: beachfront.ImageryCatalogPage
  isSearching: boolean
  mode: string
  selectedFeature: beachfront.Job | beachfront.Scene
  view: MapView
  onBoundingBoxChange(bbox: number[])
  onSearchPageChange(page: {count: number, startIndex: number})
  onSelectFeature(feature: beachfront.Job | beachfront.Scene)
  onViewChange(view: MapView)
}

interface State {
  basemapIndex?: number
  loadingRefCount?: number
  tileLoadError?: boolean
}

export interface MapView {
  basemapIndex: number
  center: number[]
  zoom: number
}

export class PrimaryMap extends React.Component<Props, State> {
  refs: any

  private basemapLayers: ol.layer.Tile[]
  private detectionsLayer: ol.layer.Tile
  private drawLayer: ol.layer.Vector
  private drawInteraction: ol.interaction.Draw
  private featureDetailsOverlay: ol.Overlay
  private frameLayer: ol.layer.Vector
  private highlightLayer: ol.layer.Vector
  private imageSearchResultsOverlay: ol.Overlay
  private imageryLayer: ol.layer.Vector
  private map: ol.Map
  private previewLayers: {[key: string]: ol.layer.Tile}
  private selectInteraction: ol.interaction.Select
  private skipNextViewUpdate: boolean

  constructor() {
    super()
    this.state = {basemapIndex: 0, loadingRefCount: 0}
    this.emitViewChange = debounce(this.emitViewChange.bind(this), 100)
    this.handleBasemapChange = this.handleBasemapChange.bind(this)
    this.handleDrawStart = this.handleDrawStart.bind(this)
    this.handleDrawEnd = this.handleDrawEnd.bind(this)
    this.handleLoadError = this.handleLoadError.bind(this)
    this.handleLoadStart = this.handleLoadStart.bind(this)
    this.handleLoadStop = this.handleLoadStop.bind(this)
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 15)
    this.handleSelect = this.handleSelect.bind(this)
    this.updateView = debounce(this.updateView.bind(this), 100)
    this.renderImagerySearchBbox = debounce(this.renderImagerySearchBbox.bind(this))
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

    // DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG
    window['primaryMap'] = this  // tslint:disable-line
    // DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG DEBUG
  }

  componentDidUpdate(previousProps, previousState) {
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
    if (previousProps.bbox !== this.props.bbox) {
      this.renderImagerySearchBbox()
    }
    if (previousState.basemapIndex !== this.state.basemapIndex) {
      this.updateBasemap()
    }
    if (previousProps.view !== this.props.view && this.props.view) {
      this.updateView()
    }
    if (previousProps.mode !== this.props.mode) {
      this.updateInteractions()
    }
  }

  render() {
    const basemapNames = TILE_PROVIDERS.map(b => b.name)
    return (
      <main className={`${styles.root} ${this.state.loadingRefCount > 0 ? styles.isLoading : ''}`} ref="container" tabIndex={1}>
        <BasemapSelect
          className={styles.basemapSelect}
          index={this.state.basemapIndex}
          basemaps={basemapNames}
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

  //
  // Internals
  //

  private activateDrawInteraction() {
    this.drawInteraction.setActive(true)
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

  private deactivateDrawInteraction() {
    this.drawInteraction.setActive(false)
  }

  private deactivateSelectInteraction() {
    this.clearSelection()
    this.emitDeselectAll()
    this.selectInteraction.setActive(false)
  }

  private emitViewChange() {
    const view = this.map.getView()
    const {basemapIndex} = this.state
    const center = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326')
    const zoom = view.getZoom() || MIN_ZOOM  // HACK -- sometimes getZoom returns undefined...
    // Don't emit false positives
    if (!this.props.view
      || this.props.view.center[0] !== center[0]
      || this.props.view.center[1] !== center[1]
      || this.props.view.zoom !== zoom
      || this.props.view.basemapIndex !== basemapIndex) {
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

  private handleLoadError(event) {
    this.setState({
      loadingRefCount: Math.max(0, this.state.loadingRefCount - 1),
    })

    const tile = event.tile
    if (!tile.loadingError) {
      tile.loadingError = true
      tile.load()
    }
  }

  private handleLoadStart() {
    this.setState({
      loadingRefCount: this.state.loadingRefCount + 1,
    })
  }

  private handleLoadStop() {
    this.setState({
      loadingRefCount: Math.max(0, this.state.loadingRefCount - 1),
    })
  }

  private handleMouseMove(event) {
    const layerFilter = l => l === this.frameLayer || l === this.imageryLayer
    let foundFeature = false
    this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
      switch (feature.get(KEY_TYPE)) {
        case TYPE_DIVOT_INBOARD:
        case TYPE_JOB:
        case TYPE_SCENE:
          foundFeature = true
          return true
      }
    }, null, layerFilter)
    if (foundFeature) {
      this.refs.container.classList.add(styles.isHoveringFeature)
    }
    else {
      this.refs.container.classList.remove(styles.isHoveringFeature)
    }
  }

  private handleSelect(event) {
    if (event.selected.length === 0 && event.deselected.length === 0) {
      return  // Disregard spurious select event
    }

    const [feature] = event.selected
    let position, type
    if (feature) {
      position = ol.extent.getCenter(feature.getGeometry().getExtent())
      type = feature.get(KEY_TYPE)
    }

    this.featureDetailsOverlay.setPosition(position)
    const selections = this.selectInteraction.getFeatures()
    switch (type) {
      case TYPE_DIVOT_INBOARD:
      case TYPE_STEM:
        // Proxy clicks on "inner" decorations out to the job frame itself
        const jobId = feature.get(KEY_OWNER_ID)
        const jobFeature = this.frameLayer.getSource().getFeatureById(jobId)
        selections.clear()
        selections.push(jobFeature)
        this.props.onSelectFeature(toGeoJSON(jobFeature) as beachfront.Job)
        break
      case TYPE_JOB:
      case TYPE_SCENE:
        this.props.onSelectFeature(toGeoJSON(feature) as beachfront.Scene)
        break
      default:
        // Not a valid "selectable" feature
        this.clearSelection()
        this.emitDeselectAll()
        break
    }
  }

  private initializeOpenLayers() {
    this.basemapLayers = generateBasemapLayers(TILE_PROVIDERS)
    this.detectionsLayer = generateDetectionsLayer()
    this.drawLayer = generateDrawLayer()
    this.highlightLayer = generateHighlightLayer()
    this.frameLayer = generateFrameLayer()
    this.imageryLayer = generateImageryLayer()
    this.previewLayers = {}  // FIXME -- Use a Map instead?
    this.subscribeToLoadEvents(this.detectionsLayer)

    this.drawInteraction = generateDrawInteraction(this.drawLayer)
    this.drawInteraction.on('drawstart', this.handleDrawStart)
    this.drawInteraction.on('drawend', this.handleDrawEnd)

    this.selectInteraction = generateSelectInteraction(this.frameLayer, this.imageryLayer)
    this.selectInteraction.on('select', this.handleSelect)

    this.featureDetailsOverlay = generateFeatureDetailsOverlay(this.refs.featureDetails)
    this.imageSearchResultsOverlay = generateImageSearchResultsOverlay(this.refs.imageSearchResults)

    this.map = new ol.Map({
      controls: generateControls(),
      interactions: generateBaseInteractions().extend([this.drawInteraction, this.selectInteraction]),
      layers: [
        // Order matters here
        ...this.basemapLayers,
        this.frameLayer,
        this.drawLayer,
        this.imageryLayer,
        this.detectionsLayer,
        this.highlightLayer,
      ],
      target: this.refs.container,
      view: new ol.View({
        center: ol.proj.fromLonLat(DEFAULT_CENTER),
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
    this.setState({basemapIndex})
    const view = this.map.getView()
    view.setCenter(view.constrainCenter(ol.proj.transform(center, 'EPSG:4326', 'EPSG:3857')))
    view.setZoom(zoom)
  }

  private renderDetections() {
    const {detections, geoserverUrl} = this.props
    const layer = this.detectionsLayer
    const source = layer.getSource() as ol.source.TileWMS
    const currentLayerIds = source.getParams()[KEY_LAYERS]
    const incomingLayerIds = detections.map(d => d.properties.detectionsLayerId).sort().join(',')

    if (!geoserverUrl) {
      return  // No server to point to
    }
    if (currentLayerIds === incomingLayerIds) {
      return  // Nothing to do
    }

    // Removals
    if (!incomingLayerIds && currentLayerIds) {
      layer.setExtent([0, 0, 0, 0])
      layer.setSource(generateDetectionsSource())
      this.subscribeToLoadEvents(layer)
      return
    }

    // Additions/Updates
    const extent = ol.extent.createEmpty()
    detections.forEach(d => ol.extent.extend(extent, featureToBbox(d)))
    layer.setExtent(extent)
    source.updateParams({
      [KEY_LAYERS]: incomingLayerIds,
    })
    source.setUrl(`${geoserverUrl}/wms`)
  }

  private renderFrames() {
    this.clearFrames()

    const source = this.frameLayer.getSource()
    const reader = new ol.format.GeoJSON()
    this.props.frames.forEach(raw => {
      const frame = reader.readFeature(raw, {featureProjection: WEB_MERCATOR})
      source.addFeature(frame)

      const frameExtent = frame.getGeometry().getExtent()
      const topRight = ol.extent.getTopRight(ol.extent.buffer(frameExtent, STEM_OFFSET))
      const center = ol.extent.getCenter(frameExtent)
      const id = frame.getId()

      const stem = new ol.Feature({
        geometry: new ol.geom.LineString([
          center,
          topRight,
        ]),
      })
      stem.set(KEY_TYPE, TYPE_STEM)
      stem.set(KEY_OWNER_ID, id)
      source.addFeature(stem)

      const divotInboard = new ol.Feature({
        geometry: new ol.geom.Point(center),
      })
      divotInboard.set(KEY_TYPE, TYPE_DIVOT_INBOARD)
      divotInboard.set(KEY_OWNER_ID, id)
      source.addFeature(divotInboard)

      const divotOutboard = new ol.Feature({
        geometry: new ol.geom.Point(topRight),
      })
      divotOutboard.set(KEY_TYPE, TYPE_DIVOT_OUTBOARD)
      divotOutboard.set(KEY_OWNER_ID, id)
      divotOutboard.set(KEY_STATUS, raw.properties.status)
      source.addFeature(divotOutboard)

      const name = new ol.Feature({
        geometry: new ol.geom.Point(topRight),
      })
      name.set(KEY_TYPE, TYPE_LABEL_MAJOR)
      name.set(KEY_OWNER_ID, id)
      name.set(KEY_NAME, raw.properties.name.toUpperCase())
      source.addFeature(name)

      const status = new ol.Feature({
        geometry: new ol.geom.Point(topRight),
      })
      status.set(KEY_TYPE, TYPE_LABEL_MINOR)
      status.set(KEY_OWNER_ID, id)
      status.set(KEY_STATUS, raw.properties.status)
      status.set(KEY_IMAGE_ID, (raw as beachfront.Job).properties.sceneId)
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

    const reader = new ol.format.GeoJSON()
    const feature = reader.readFeature(geojson, {featureProjection: 'EPSG:3857'})

    source.addFeature(feature)
  }

  private renderImagery() {
    const {imagery} = this.props
    const reader = new ol.format.GeoJSON()
    const source = this.imageryLayer.getSource()
    source.setAttributions(undefined)
    source.clear()
    if (imagery) {
      const features = reader.readFeatures(imagery.images, {featureProjection: WEB_MERCATOR})
      if (features.length) {
        features.forEach(feature => {
          feature.set(KEY_TYPE, TYPE_SCENE)
        })
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
      this.imageSearchResultsOverlay.setPosition(ol.extent.getBottomRight(bbox))
      this.imageSearchResultsOverlay.setPositioning('top-right')
    }
    else {
      // No results
      this.imageSearchResultsOverlay.setPosition(ol.extent.getCenter(bbox))
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
    const feature = new ol.Feature({
      geometry: ol.geom.Polygon.fromExtent(bbox),
    })
    this.drawLayer.getSource().addFeature(feature)
  }

  private renderSelectionPreview() {
    const images = featuresToImages(this.props.selectedFeature)
    const shouldRender = {}
    const alreadyRendered = {}

    images.forEach(i => shouldRender[i.id] = true)

    // Removals
    Object.keys(this.previewLayers).forEach(imageId => {
      const layer = this.previewLayers[imageId]
      alreadyRendered[imageId] = true
      if (!shouldRender[imageId]) {
        delete this.previewLayers[imageId]
        animateLayerExit(layer).then(() => {
          this.map.removeLayer(layer)
        })
      }
    })

    // Additions
    const insertionIndex = this.basemapLayers.length
    images.filter(i => shouldRender[i.id] && !alreadyRendered[i.id]).forEach(image => {
      const chunks = image.id.match(/^(\w+):(.*)$/)
      if (!chunks) {
        console.warn('(@primaryMap._renderSelectionPreview) Invalid image ID: `%s`', image.id)
        return
      }

      const [, prefix, externalImageId] = chunks
      const provider = SCENE_TILE_PROVIDERS.find(p => p.prefix === prefix)
      if (!provider) {
        console.warn('(@primaryMap._renderSelectionPreview) No provider available for image `%s`', image.id)
        return
      }

      // HACK HACK HACK HACK
      const apiKey = this.props.catalogApiKey
      // HACK HACK HACK HACK

      const layer = new ol.layer.Tile({
        extent: image.extent,
        source: generateScenePreviewSource(provider, externalImageId, apiKey),
      })

      this.subscribeToLoadEvents(layer)
      this.previewLayers[image.id] = layer
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
    switch (this.props.mode) {
      case MODE_SELECT_IMAGERY:
        this.deactivateDrawInteraction()
        this.activateSelectInteraction()
        break
      case MODE_DRAW_BBOX:
        this.activateDrawInteraction()
        this.deactivateSelectInteraction()
        break
      case MODE_NORMAL:
        this.clearDraw()
        this.deactivateDrawInteraction()
        this.activateSelectInteraction()
        break
      case MODE_PRODUCT_LINES:
        this.clearDraw()
        this.deactivateDrawInteraction()
        this.activateSelectInteraction()
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
    const reader = new ol.format.GeoJSON()
    const feature = reader.readFeature(selectedFeature, {dataProjection: WGS84, featureProjection: WEB_MERCATOR})
    const center = ol.extent.getCenter(feature.getGeometry().getExtent())
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

function featuresToImages(...features: (beachfront.Job|beachfront.Scene)[]) {
  return features.filter(Boolean).map(feature => ({
    extent: featureToBbox(feature),
    id:     (feature as beachfront.Job).properties.sceneId || feature.id,
  }))
}

function generateBasemapLayers(providers) {
  return providers.map((provider, index) => {
    const source = new ol.source.XYZ(Object.assign({}, provider, {crossOrigin: 'anonymous', tileLoadFunction}))
    const layer = new ol.layer.Tile({source})
    layer.setProperties({name: provider.name, visible: index === 0})
    return layer
  })
}

function generateBaseInteractions() {
  return ol.interaction.defaults().extend([
    new ol.interaction.DragRotate({
      condition: ol.events.condition.altKeyOnly,
    }),
  ])
}

function generateControls() {
  return ol.control.defaults({
    attributionOptions: {
      collapsible: false,
    },
  }).extend([
    new ol.control.ScaleLine({
      minWidth: 250,
      units: 'nautical',
    }),
    new ol.control.ZoomSlider(),
    new ol.control.MousePosition({
      coordinateFormat: ol.coordinate.toStringHDMS,
      projection: WGS84,
    }),
    new ol.control.FullScreen(),
    new ExportControl(styles.export),
    new SearchControl(styles.search),
  ])
}

function generateDetectionsLayer() {
  return new ol.layer.Tile({
    source: generateDetectionsSource(),
  })
}

function generateDetectionsSource() {
  return new ol.source.TileWMS({
    tileLoadFunction,
    crossOrigin: 'anonymous',
    params: {
      [KEY_LAYERS]: '',
    },
  })
}

function generateDrawLayer() {
  return new ol.layer.Vector({
    source: new ol.source.Vector({
      wrapX: false,
    }),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'hsla(202, 70%, 50%, .35)',
      }),
      stroke: new ol.style.Stroke({
        color: 'hsla(202, 70%, 50%, .7)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })
}

function generateDrawInteraction(drawLayer) {
  const draw = new ol.interaction.Draw({
    source: drawLayer.getSource(),
    maxPoints: 2,
    type: 'LineString',
    geometryFunction(coordinates, geometry: ol.geom.Polygon) {
      if (!geometry) {
        geometry = new ol.geom.Polygon(null)
      }
      const [[x1, y1], [x2, y2]] = coordinates
      geometry.setCoordinates([[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]])
      return geometry
    },
    style: new ol.style.Style({
      image: new ol.style.RegularShape({
        stroke: new ol.style.Stroke({
          color: 'black',
          width: 1,
        }),
        points: 4,
        radius: 15,
        radius2: 0,
        angle: 0,
      }),
      fill: new ol.style.Fill({
        color: 'hsla(202, 70%, 50%, .6)',
      }),
      stroke: new ol.style.Stroke({
        color: 'hsl(202, 70%, 50%)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })
  draw.setActive(false)
  return draw
}

function generateFrameLayer() {
  return new ol.layer.Vector({
    source: new ol.source.Vector(),
    style(feature, resolution) {
      const isClose = resolution < RESOLUTION_CLOSE
      switch (feature.get(KEY_TYPE)) {
        case TYPE_DIVOT_INBOARD:
          return new ol.style.Style({
            image: new ol.style.RegularShape({
              angle: Math.PI / 4,
              points: 4,
              radius: 5,
              fill: new ol.style.Fill({
                color: 'black',
              }),
            }),
          })
        case TYPE_DIVOT_OUTBOARD:
          return new ol.style.Style({
            image: new ol.style.RegularShape({
              angle: Math.PI / 4,
              points: 4,
              radius: 10,
              stroke: new ol.style.Stroke({
                color: 'black',
                width: 1,
              }),
              fill: new ol.style.Fill({
                color: getColorForStatus(feature.get(KEY_STATUS)),
              }),
            }),
          })
        case TYPE_STEM:
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'black',
              width: 1,
            }),
          })
        case TYPE_LABEL_MAJOR:
          return new ol.style.Style({
            text: new ol.style.Text({
              fill: new ol.style.Fill({
                color: 'black',
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
          return new ol.style.Style({
            text: new ol.style.Text({
              fill: new ol.style.Fill({
                color: 'rgba(0,0,0,.6)',
              }),
              offsetX: 13,
              offsetY: 15,
              font: '11px Verdana, sans-serif',
              text: ([
                feature.get(KEY_STATUS),
                feature.get(KEY_IMAGE_ID),
              ].filter(Boolean)).join(' // ').toUpperCase(),
              textAlign: 'left',
              textBaseline: 'middle',
            }),
          })
        default:
          return new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: 'rgba(0, 0, 0, .4)',
              lineDash: [10, 10],
            }),
            fill: new ol.style.Fill({
              color: isClose ? 'transparent' : 'hsla(202, 100%, 85%, 0.5)',
            }),
          })
      }
    },
  })
}

function generateHighlightLayer() {
  return new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'hsla(90, 100%, 30%, .5)',
      }),
      stroke: new ol.style.Stroke({
        color: 'hsla(90, 100%, 30%, .6)',
      }),
    }),
  })
}

function generateImageryLayer() {
  return new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(0,0,0, .15)',
      }),
      stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0, .5)',
        width: 1,
      }),
    }),
  })
}

function generateFeatureDetailsOverlay(componentRef) {
  return new ol.Overlay({
    autoPan:     true,
    element:     findDOMNode(componentRef),
    id:          'featureDetails',
    positioning: 'top-left',
  })
}

function generateImageSearchResultsOverlay(componentRef) {
  return new ol.Overlay({
    autoPan:   true,
    element:   findDOMNode(componentRef),
    id:        'imageSearchResults',
    stopEvent: false,
  })
}

function generateScenePreviewSource(provider, imageId, apiKey) {
  return new ol.source.XYZ(Object.assign({}, provider, {
    crossOrigin: 'anonymous',
    tileLoadFunction,
    url: provider.url
           .replace('__IMAGE_ID__', imageId)
           .replace('__API_KEY__', apiKey),
  }))
}

function generateSelectInteraction(...layers) {
  return new ol.interaction.Select({
    layers,
    condition: ol.events.condition.click,
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'black',
        width: 3,
      }),
    }),
  })
}

function getColorForStatus(status) {
  switch (status) {
    case STATUS_ACTIVE: return 'hsl(200, 94%, 54%)'
    case STATUS_INACTIVE: return 'hsl(0, 0%, 50%)'
    case STATUS_RUNNING: return 'hsl(48, 94%, 54%)'
    case STATUS_SUCCESS: return 'hsl(114, 100%, 45%)'
    case STATUS_TIMED_OUT:
    case STATUS_ERROR: return 'hsl(349, 100%, 60%)'
    default: return 'magenta'
  }
}

function tileLoadFunction(imageTile, src) {
  if (imageTile.loadingError) {
    delete imageTile.loadingError
    imageTile.getImage().src = tileErrorPlaceholder
  }
  else {
    imageTile.getImage().src = src
  }
}

function toGeoJSON(feature) {
  const io = new ol.format.GeoJSON()
  return io.writeFeatureObject(feature, {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'})
}