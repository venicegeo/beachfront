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

import * as React from 'react'
import {ReactInstance} from 'react'
import {findDOMNode} from 'react-dom'
import {connect} from 'react-redux'
import debounce = require('lodash/debounce')
import throttle = require('lodash/throttle')
import {GeoJSON} from 'geojson'
import {ImageLoadFunctionType} from 'openlayers'
import OLBaseLayer from 'ol/layer/base'
import OLCollection from 'ol/collection'
import OLCondition from 'ol/events/condition'
import OLControl from 'ol/control'
import OLCoordinate from 'ol/coordinate'
import OLDragRotate from 'ol/interaction/dragrotate'
import OLDraw from 'ol/interaction/draw'
import OLExtent from 'ol/extent'
import OLEvent from 'ol/events/event'
import OLFeature from 'ol/feature'
import OLFill from 'ol/style/fill'
import OLGeoJSON from 'ol/format/geojson'
import OLImageLayer from 'ol/layer/image'
import OLImageStatic from 'ol/source/imagestatic'
import OLImageTile from 'ol/imagetile'
import OLInteraction from 'ol/interaction'
import OLLayer from 'ol/layer/layer'
import OLLineString from 'ol/geom/linestring'
import OLMap from 'ol/map'
import OLMapBrowserEvent from 'ol/mapbrowserevent'
import OLMapBrowserPointerEvent from 'ol/mapbrowserpointerevent'
import OLMousePosition from 'ol/control/mouseposition'
import OLOverlay from 'ol/overlay'
import OLPoint from 'ol/geom/point'
import OLPolygon from 'ol/geom/polygon'
import OLProj from 'ol/proj'
import OLRegularShape from 'ol/style/regularshape'
import OLScaleLine from 'ol/control/scaleline'
import OLSelect from 'ol/interaction/select'
import OLStyle from 'ol/style/style'
import OLStroke from 'ol/style/stroke'
import OLText from 'ol/style/text'
import OLTile from 'ol/tile'
import OLTileLayer from 'ol/layer/tile'
import OLTileWMS from 'ol/source/tilewms'
import OLVectorLayer from 'ol/layer/vector'
import OLVectorSource from 'ol/source/vector'
import OLView from 'ol/view'
import OLXYZ from 'ol/source/xyz'
import OLZoomSlider from 'ol/control/zoomslider'
import {ExportControl} from '../utils/openlayers.ExportControl'
import {SearchControl} from '../utils/openlayers.SearchControl'
import {MeasureControl} from '../utils/openlayers.MeasureControl'
import {ScaleControl} from '../utils/openlayers.ScaleControl'
import {BasemapSelect} from './BasemapSelect'
import FeatureDetails from './FeatureDetails'
import {LoadingAnimation} from './LoadingAnimation'
import ImagerySearchResults from './ImagerySearchResults'
import {normalizeSceneId} from './SceneFeatureDetails'
import {
  featureToExtent,
  deserializeBbox,
  serializeBbox,
  toGeoJSON,
  getWrapIndex,
  extentWrapped,
  calculateExtent,
  featureToExtentWrapped,
  WEB_MERCATOR_MIN,
  WEB_MERCATOR_MAX, Point, Extent,
} from '../utils/geometries'
import {wrap} from '../utils/math'
import {
  BASEMAP_TILE_PROVIDERS,
  SCENE_TILE_PROVIDERS,
  GEOSERVER_WORKSPACE_NAME,
  GEOSERVER_LAYERGROUP_NAME, BasemapTileProvider, SceneTileProvider,
} from '../config'
import {
  STATUS_ACTIVE,
  STATUS_ERROR,
  STATUS_FAIL,
  STATUS_INACTIVE,
  STATUS_PENDING,
  STATUS_SUBMITTED,
  STATUS_ACTIVATING,
  STATUS_RUNNING,
  STATUS_SUCCESS,
  STATUS_TIMED_OUT,
  STATUS_CANCELLED,
  TYPE_SCENE,
  TYPE_JOB,
  WEB_MERCATOR,
  WGS84,
} from '../constants'
import {AppState} from '../store'
import {mapActions} from '../actions/mapActions'
import {MapCollections} from '../reducers/mapReducer'
import {userActions} from '../actions/userActions'
import {catalogActions, CatalogSearchArgs} from '../actions/catalogActions'

const DEFAULT_CENTER: Point = [-10, 0]
const MIN_ZOOM = 2.5
const MAX_ZOOM = 22
const RESOLUTION_CLOSE = 850
const VIEW_BOUNDS: Extent = [-Number.MAX_SAFE_INTEGER, -90, Number.MAX_SAFE_INTEGER, 90]
const STEM_OFFSET = 10000
const IDENTIFIER_DETECTIONS = GEOSERVER_WORKSPACE_NAME + ':' + GEOSERVER_LAYERGROUP_NAME
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
export const MODE_DRAW_BBOX = 'MODE_DRAW_BBOX'
export const MODE_NORMAL = 'MODE_NORMAL'
export const MODE_PRODUCT_LINES = 'MODE_PRODUCT_LINES'
export const MODE_SELECT_IMAGERY = 'MODE_SELECT_IMAGERY'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type PassedProps = {
  shrunk: boolean
}
type Props = StateProps & DispatchProps & PassedProps

interface State {
  basemapIndex: number
  isMeasuring: boolean
  loadingRefCount: number
  tileLoadError: boolean
  selectedFeatureHalfWrapIndex: number
  bboxHalfWrapIndex: number
}

export interface MapView {
  basemapIndex: number
  center?: Point
  zoom?: number
  extent?: Extent
}

interface Tile extends OLTile {
  loadingError: boolean
}

interface ImageTile extends OLImageTile {
  loadingError: boolean
}

export class PrimaryMap extends React.Component<Props, State> {
  refs: any

  private basemapLayers: OLTileLayer[]
  private bboxDrawInteraction: OLDraw
  private detectionsLayers: {[key: string]: OLTileLayer}
  private drawLayer: OLVectorLayer
  private featureDetailsOverlay: OLOverlay
  private featureId: number | string | null
  private frameLayer: OLVectorLayer
  private frameFillLayer: OLVectorLayer
  private pinLayer: OLVectorLayer
  private highlightLayer: OLVectorLayer
  private hoverInteraction: OLSelect
  private imageSearchResultsOverlay: OLOverlay
  private imageryLayer: OLVectorLayer
  private map: OLMap
  private previewLayers: {[key: string]: OLLayer}
  private selectInteraction: OLSelect
  private skipNextViewUpdate: boolean

  constructor(props: Props) {
    super(props)
    this.state = {
      basemapIndex: 0,
      isMeasuring: false,
      loadingRefCount: 0,
      tileLoadError: false,
      selectedFeatureHalfWrapIndex: 0,
      bboxHalfWrapIndex: 0,
    }
    this.emitViewChange = debounce(this.emitViewChange.bind(this), 100)
    this.handleMapMoveEnd = this.handleMapMoveEnd.bind(this)
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
    this.handlePageChange = this.handlePageChange.bind(this)
    this.handleSignOutClick = this.handleSignOutClick.bind(this)
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
    this.renderPins()
    this.updateView(2000)

    if (this.props.map.bbox) {
      this.renderImagerySearchBbox()
    }

    this.updateInteractions()

    if (this.props.map.selectedFeature) {
      this.updateSelectedFeature()
    }

    // Used by tests
    (window as any)['primaryMap'] = this  // tslint:disable-line

    this.props.actions.map.initialized(this.map, {
      hovered: this.hoverInteraction.getFeatures(),
      imagery: this.imageryLayer.getSource().getFeaturesCollection(),
      selected: this.selectInteraction.getFeatures(),
      handleSelectFeature: this.handleSelectFeature,
    })
  }

  componentDidUpdate(previousProps: Props, previousState: State) {
    const routeChanged = previousProps.route.pathname !== this.props.route.pathname

    if (!this.props.map.selectedFeature) {
      this.clearSelection()
    }

    if (previousProps.map.selectedFeature !== this.props.map.selectedFeature ||
        previousState.selectedFeatureHalfWrapIndex !== this.state.selectedFeatureHalfWrapIndex) {
      this.renderSelectionPreview()
      this.updateSelectedFeature()
    }

    if (previousProps.map.detections !== this.props.map.detections ||
        previousState.selectedFeatureHalfWrapIndex !== this.state.selectedFeatureHalfWrapIndex) {
      this.renderDetections()
    }

    /*
     This block will attempt to determine if a Job is currently selected, and has had it's status changed to a SUCCESS,
     in which case the detections layer in OpenLayers should be refreshed. Only perform this check on Jobs, and only
     refresh the layer if the Job's status has changed to success.
    */
    const selectedJob = (this.props.map.selectedFeature as beachfront.Job)
    if (selectedJob) {
      const previousJob = previousProps.jobs.records.filter(j => j.properties.job_id === selectedJob.properties.job_id)[0]
      const currentJob = this.props.jobs.records.filter(j => j.properties.job_id === selectedJob.properties.job_id)[0]
      if (previousJob && currentJob) {
        if ((previousJob.properties.status !== STATUS_SUCCESS) && (currentJob.properties.status === STATUS_SUCCESS)) {
          this.refreshDetections()
        }
      }
    }

    if (previousProps.map.hoveredFeature !== this.props.map.hoveredFeature) {
      this.renderHighlight()
    }

    if (previousProps.map.frames !== this.props.map.frames) {
      this.renderFrames()
      this.renderFrameFills()
      this.renderPins()
    }

    if (previousProps.catalog.searchResults !== this.props.catalog.searchResults || routeChanged) {
      this.renderImagery()
    }

    if (previousProps.catalog.isSearching !== this.props.catalog.isSearching) {
      this.clearSelection()
    }

    if (previousProps.catalog.isSearching !== this.props.catalog.isSearching ||
      previousState.bboxHalfWrapIndex !== this.state.bboxHalfWrapIndex) {
      this.renderImagerySearchResultsOverlay({ autoPan: previousProps.catalog.isSearching !== this.props.catalog.isSearching })
    }

    if (previousProps.shrunk !== this.props.shrunk) {
      this.updateMapSize()
    }

    if (previousProps.map.bbox !== this.props.map.bbox || routeChanged ||
        previousState.bboxHalfWrapIndex !== this.state.bboxHalfWrapIndex) {
      this.renderImagerySearchBbox()
    }

    if (previousState.basemapIndex !== this.state.basemapIndex) {
      this.updateBasemap()
    }

    if (previousProps.map.view !== this.props.map.view && this.props.map.view) {
      this.updateView()
    }

    if ((!previousProps.map.view) ||
      (this.props.map.view && previousProps.map.view.zoom !== this.props.map.view.zoom) ||
      (previousProps.map.selectedFeature !== this.props.map.selectedFeature) ||
      (previousProps.map.frames !== this.props.map.frames)) {
      this.updateStyles()
    }

    if ((previousProps.map.mode !== this.props.map.mode) ||
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
        <div className={styles.logout}><a onClick={this.handleSignOutClick}>Sign Out</a></div>
        <BasemapSelect
          className={styles.basemapSelect}
          index={this.state.basemapIndex}
          basemaps={BASEMAP_TILE_PROVIDERS.map(b => b.name)}
          onChange={this.handleBasemapChange}
        />
        <FeatureDetails
          ref="featureDetails"
        />
        <ImagerySearchResults
          ref="imageSearchResults"
          onPageChange={this.handlePageChange}
        />
        <LoadingAnimation
          className={styles.loadingIndicator}
        />
      </main>
    )
  }

  handleSelectFeature(feature_or_id: OLFeature | string) {
    const feature: any = typeof feature_or_id === 'string'
      ? this.imageryLayer.getSource().getFeatureById(feature_or_id)
      : feature_or_id

    switch (feature ? feature.get(KEY_TYPE) : null) {
      case TYPE_DIVOT_OUTBOARD:
        // Proxy clicks on "inner" decorations out to the job frame itself
        this.featureId = feature.ol_uid
        const jobId = feature.get(KEY_OWNER_ID)
        const jobFeature = this.frameLayer.getSource().getFeatureById(jobId)
        const selections = this.selectInteraction.getFeatures()
        selections.clear()
        selections.push(jobFeature)
        this.props.actions.map.setSelectedFeature((toGeoJSON(jobFeature) as unknown) as beachfront.Job)
        break
      case TYPE_JOB:
      case TYPE_SCENE:
        this.featureId = feature.ol_uid
        this.props.actions.map.setSelectedFeature((toGeoJSON(feature) as unknown) as beachfront.Scene)
        break
      default:
        // Not a valid "selectable" feature
        this.featureId = null
        this.clearSelection()
        this.emitDeselectAll()
        break
    }
  }

  private handlePageChange(args: {startIndex: number, count: number}) {
    this.props.actions.catalog.search(args)
  }

  private handleSignOutClick() {
    if (confirm('Are you sure you want to sign out of Beachfront?')) {
      this.props.actions.user.logout()
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

  private clearFrameFills() {
    this.frameFillLayer.getSource().clear()
  }

  private clearPins() {
    this.pinLayer.getSource().clear()
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

  private deactivateSelectInteraction() {
    this.selectInteraction.setActive(false)
  }

  private emitViewChange() {
    const view = this.map.getView()
    const {basemapIndex} = this.state
    const center = OLProj.transform(view.getCenter(), WEB_MERCATOR, WGS84)
    const zoom = view.getZoom() || MIN_ZOOM  // HACK -- sometimes getZoom returns undefined...

    // Don't emit false positives
    if (this.props.map.view
      && this.props.map.view.center
      && this.props.map.view.center[0] === center[0]
      && this.props.map.view.zoom === zoom
      && this.props.map.view.basemapIndex === basemapIndex) {
      return
    }

    this.skipNextViewUpdate = true
    this.props.actions.map.updateView({ basemapIndex, center, zoom })
  }

  private handleMapMoveEnd() {
    let {selectedFeatureHalfWrapIndex, bboxHalfWrapIndex} = this.state

    // Check if we should re-render any manually looped elements.
    if (this.props.map.selectedFeature) {
      let selectedFeatureCenter = OLExtent.getCenter(featureToExtent(this.props.map.selectedFeature))
      selectedFeatureCenter = OLProj.transform(selectedFeatureCenter, WEB_MERCATOR, WGS84)
      selectedFeatureHalfWrapIndex = getWrapIndex(this.map, selectedFeatureCenter)
    }

    if (this.props.map.bbox) {
      let bboxCenter = OLExtent.getCenter(this.props.map.bbox)
      bboxHalfWrapIndex = getWrapIndex(this.map, bboxCenter)
    }

    if (selectedFeatureHalfWrapIndex !== this.state.selectedFeatureHalfWrapIndex ||
        bboxHalfWrapIndex !== this.state.bboxHalfWrapIndex) {
      this.setState({
        selectedFeatureHalfWrapIndex,
        bboxHalfWrapIndex,
      })
    }

    this.emitViewChange()
  }

  private emitDeselectAll() {
    this.props.actions.map.setSelectedFeature(null)
  }

  private handleBasemapChange(index: number) {
    this.setState({basemapIndex: index})
    this.emitViewChange()
  }

  private handleDrawEnd(event: OLEvent & { feature: OLFeature }) {
    const geometry = event.feature.getGeometry()
    let bbox = serializeBbox(geometry.getExtent())

    this.props.actions.map.updateBbox(bbox)
  }

  private handleDrawStart() {
    this.clearDraw()
    this.props.actions.map.updateBbox(null)
  }

  private handleMeasureEnd() {
    this.setState({ isMeasuring: false })
  }

  private handleMeasureStart() {
    this.setState({ isMeasuring: true })
  }

  private handleLoadError(event: OLEvent & { tile: Tile }) {
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

  private handleMouseMove(event: OLMapBrowserEvent) {
    if (this.state.isMeasuring || this.props.map.mode === MODE_DRAW_BBOX) {
      this.refs.container.classList.remove(styles.isHoveringFeature)
      return
    }

    let foundFeature = false
    this.map.forEachFeatureAtPixel(event.pixel, feature => {
      switch (feature.get(KEY_TYPE)) {
        case TYPE_DIVOT_INBOARD:
        case TYPE_DIVOT_OUTBOARD:
        case TYPE_JOB:
        case TYPE_SCENE:
          foundFeature = true
          return true
      }
    }, { layerFilter: l => l === this.frameLayer || l === this.imageryLayer || l === this.pinLayer })

    if (foundFeature) {
      this.refs.container.classList.add(styles.isHoveringFeature)
    } else {
      this.refs.container.classList.remove(styles.isHoveringFeature)
    }
  }

  private handleSelect(event: OLSelect.Event) {
    if (event.selected.length || event.deselected.length) {
      let index = event.selected.findIndex((f: any) => f.ol_uid === this.featureId) + 1

      const pointerEvent = (event.mapBrowserEvent as OLMapBrowserPointerEvent).pointerEvent as any
      if (!pointerEvent.shiftKey) {
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
    this.frameFillLayer = generateFrameFillLayer()
    this.pinLayer = generatePinLayer()
    this.imageryLayer = generateImageryLayer()
    this.detectionsLayers = {}
    this.previewLayers = {}

    this.bboxDrawInteraction = generateBboxDrawInteraction(this.drawLayer)
    this.bboxDrawInteraction.on('drawstart', this.handleDrawStart)
    this.bboxDrawInteraction.on('drawend', this.handleDrawEnd)

    this.hoverInteraction = generateHoverInteraction(this.imageryLayer)

    this.selectInteraction = generateSelectInteraction(this.frameLayer, this.imageryLayer, this.pinLayer)
    this.selectInteraction.on('select', this.handleSelect)

    this.featureDetailsOverlay = generateFeatureDetailsOverlay(this.refs.featureDetails)
    this.imageSearchResultsOverlay = generateImageSearchResultsOverlay(this.refs.imageSearchResults)

    this.map = new OLMap({
      controls: generateControls(),
      interactions: generateBaseInteractions().extend([
        this.bboxDrawInteraction,
        this.selectInteraction,
        this.hoverInteraction,
      ]),
      layers: [
        // Order matters here
        ...this.basemapLayers,
        this.frameFillLayer,
        this.frameLayer,
        this.drawLayer,
        this.imageryLayer,
        this.pinLayer,
        this.highlightLayer,
      ] as OLBaseLayer[],
      target: this.refs.container,
      view: new OLView({
        center: OLProj.fromLonLat(DEFAULT_CENTER, WEB_MERCATOR),
        extent: OLProj.transformExtent(VIEW_BOUNDS, WGS84, WEB_MERCATOR),
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
    this.map.on('moveend', this.handleMapMoveEnd)

    this.map.on('measure:start', this.handleMeasureStart)
    this.map.on('measure:end', this.handleMeasureEnd)
  }

  private updateView(duration?: number) {
    if (this.skipNextViewUpdate) {
      this.skipNextViewUpdate = false
      return
    }

    if (!this.props.map.view) {
      return
    }

    const {basemapIndex, zoom, center, extent} = this.props.map.view
    this.setState({ basemapIndex })
    const view = this.map.getView()

    if (extent) {
      view.fit(extent, {
        padding: [100, 100, 100, 100],
        constrainResolution: false,
        duration,
      })
    } else if (center) {
      view.animate({
        center: view.constrainCenter(OLProj.transform(center, WGS84, WEB_MERCATOR)),
        zoom,
        duration,
      })
    }
  }

  private refreshDetections() {
    Object.keys(this.detectionsLayers).forEach(layerId => {
      const layer = this.detectionsLayers[layerId]
      layer.getSource().refresh()
    })
  }

  private renderDetections() {
    // Remove currently rendered detections.
    Object.keys(this.detectionsLayers).forEach(layerId => {
      const layer = this.detectionsLayers[layerId]
      delete this.detectionsLayers[layerId]
      animateLayerExit(layer).then(() => { this.map.removeLayer(layer) })
    })

    // Render detections.
    const insertionIndex = this.map.getLayers().getArray().indexOf(this.frameLayer)
    this.props.map.detections.forEach(detection => {
      let layer: OLTileLayer

      let extent = featureToExtentWrapped(this.map, detection)
      layer = new OLTileLayer({
        source: generateDetectionsSource(this.props.apiStatus.geoserver.wmsUrl!, detection),
        extent,
      })

      layer.setZIndex(2)
      this.subscribeToLoadEvents(layer)
      this.detectionsLayers[detection.id] = layer
      this.map.getLayers().insertAt(insertionIndex, layer)
    })
  }

  private renderPins() {
    this.clearPins()

    const source = this.pinLayer.getSource()
    const reader = new OLGeoJSON()

    this.props.map.frames.forEach(raw => {
      const frame = reader.readFeature(raw, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      const frameExtent = calculateExtent(frame.getGeometry())
      const topRight = OLExtent.getTopRight(OLExtent.buffer(frameExtent, STEM_OFFSET))
      const center = OLExtent.getCenter(frameExtent)
      const id = frame.getId()

      const stem = new OLFeature({
        geometry: new OLLineString([
          center,
          topRight,
        ]),
      })

      stem.set(KEY_TYPE, TYPE_STEM)
      stem.set(KEY_OWNER_ID, id)
      source.addFeature(stem)

      const divotInboard = new OLFeature({ geometry: new OLPoint(center) })
      divotInboard.set(KEY_TYPE, TYPE_DIVOT_INBOARD)
      divotInboard.set(KEY_OWNER_ID, id)
      source.addFeature(divotInboard)

      /*
       Any part of the outer divot that lies outside of -180/180 (WGS84) in the X will be unclickable. If the entire
       divot is out of bounds, this is no problem as we can simply wrap it to the other side. But for any divot that
       lies along the meridian, only part of it will be clickable. So, as a workaround, render wrapped divots twice -
       once on each side of the map.
      */
      // HACK
      const addDivotOutboard = (coordinates: Point) => {
        const divotOutboard = new OLFeature({ geometry: new OLPoint(coordinates) })
        divotOutboard.set(KEY_TYPE, TYPE_DIVOT_OUTBOARD)
        divotOutboard.set(KEY_OWNER_ID, id)
        divotOutboard.set(KEY_STATUS, raw.properties.status)
        source.addFeature(divotOutboard)
      }
      addDivotOutboard(topRight)

      if (topRight[0] < WEB_MERCATOR_MIN[0] || topRight[0] > WEB_MERCATOR_MAX[0]) {
        const halfWidth = topRight[0] - center[0]
        topRight[0] = wrap(topRight[0], WEB_MERCATOR_MIN[0], WEB_MERCATOR_MAX[0])
        center[0] = topRight[0] - halfWidth
        addDivotOutboard(topRight)
      }
      // END HACK

      const name = new OLFeature({ geometry: new OLPoint(topRight) })
      name.set(KEY_TYPE, TYPE_LABEL_MAJOR)
      name.set(KEY_OWNER_ID, id)
      name.set(KEY_NAME, raw.properties.name.toUpperCase())
      source.addFeature(name)

      const status = new OLFeature({ geometry: new OLPoint(topRight) })
      status.set(KEY_TYPE, TYPE_LABEL_MINOR)
      status.set(KEY_OWNER_ID, id)
      status.set(KEY_STATUS, raw.properties.status)
      status.set(KEY_SCENE_ID, (raw as beachfront.Job).properties.scene_id)
      status.set(KEY_NAME, (raw as beachfront.Job).properties.name)
      source.addFeature(status)
    })
  }

  private renderFrames() {
    this.clearFrames()

    const source = this.frameLayer.getSource()
    const reader = new OLGeoJSON()

    this.props.map.frames.forEach(raw => {
      const frame = reader.readFeature(raw, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      source.addFeature(frame)
    })
  }

  private renderFrameFills() {
    this.clearFrameFills()

    const source = this.frameFillLayer.getSource()
    const reader = new OLGeoJSON()

    this.props.map.frames.forEach(raw => {
      const frame = reader.readFeature(raw, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      source.addFeature(frame)
    })
  }

  private updateStyles() {
    const isClose = this.map.getView().getResolution() < RESOLUTION_CLOSE

    const frames = this.frameLayer.getSource().getFeatures()
    frames.forEach(feature => {
      const isSelected = (this.props.map.selectedFeature && this.props.map.selectedFeature.id === feature.getId())

      feature.setStyle(new OLStyle({
        stroke: new OLStroke({
          color: isSelected ? 'black' : 'transparent',
          width: 2,
        }),
      }))
    })

    const framesFills = this.frameFillLayer.getSource().getFeatures()
    framesFills.forEach(feature => {
      const isSelected = (this.props.map.selectedFeature && this.props.map.selectedFeature.id === feature.getId())

      feature.setStyle(new OLStyle({
        stroke: new OLStroke({
          color: isSelected ? 'transparent' : 'rgba(0, 0, 0, .4)',
          lineDash: isSelected ? undefined : [10, 10],
          width: 1,
        }),
        fill: new OLFill({
          color: (isClose || isSelected) ? 'transparent' : 'hsla(202, 100%, 85%, 0.5)',
        }),
      }))
    })

    const pins = this.pinLayer.getSource().getFeatures()
    pins.forEach(feature => {
      const isSelected = (this.props.map.selectedFeature && this.props.map.selectedFeature.id === feature.get(KEY_OWNER_ID))
      feature.setStyle(() => {
        switch (feature.get(KEY_TYPE)) {
          case TYPE_DIVOT_INBOARD:
            return new OLStyle({
              image: new OLRegularShape({
                angle: Math.PI / 4,
                points: 4,
                radius: 5,
                fill: new OLFill({
                  color: 'black',
                }),
              }),
            })
          case TYPE_DIVOT_OUTBOARD:
            return new OLStyle({
              image: new OLRegularShape({
                angle: Math.PI / 4,
                points: 4,
                radius: isSelected ? 15 : 10,
                stroke: new OLStroke({
                  color: 'black',
                  width: isSelected ? 2 : 1,
                }),
                fill: new OLFill({
                  color: getColorForStatus(feature.get(KEY_STATUS)),
                }),
              }),
              zIndex: isSelected ? 1 : undefined,
            })
          case TYPE_STEM:
            return new OLStyle({
              stroke: new OLStroke({
                color: 'black',
                width: 1,
              }),
            })
          case TYPE_LABEL_MAJOR:
            return new OLStyle({
              text: new OLText({
                fill: new OLFill({
                  color: isClose || isSelected ? 'black' : 'transparent',
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

            return new OLStyle({
              text: new OLText({
                fill: new OLFill({
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
            return new OLStyle()
        }
      })
    })
  }

  private renderHighlight() {
    const source = this.highlightLayer.getSource()
    source.clear()

    const geojson = this.props.map.hoveredFeature
    if (!geojson) {
      return
    }

    const reader = new OLGeoJSON()
    const feature = reader.readFeature(geojson, {
      dataProjection: WGS84,
      featureProjection: WEB_MERCATOR,
    })

    source.addFeature(feature)
  }

  private renderImagery() {
    const reader = new OLGeoJSON()
    const source = this.imageryLayer.getSource()

    source.setAttributions(undefined as any)
    source.clear()

    if (this.props.route.pathname !== '/create-job') {
      return
    }

    if (this.props.catalog.searchResults) {
      const features = reader.readFeatures(this.props.catalog.searchResults.images, {
        dataProjection: WGS84,
        featureProjection: WEB_MERCATOR,
      })

      if (features.length) {
        features.forEach(feature => {feature.set(KEY_TYPE, TYPE_SCENE)})
        source.addFeatures(features)
      }
    }
  }

  private renderImagerySearchResultsOverlay({ autoPan = false } = {}) {
    this.imageSearchResultsOverlay.setPosition(undefined as any)

    // HACK HACK HACK HACK HACK HACK HACK HACK
    let bbox = deserializeBbox(this.props.map.bbox)
    if (!bbox) {
      return  // Nothing to pin the overlay to
    }

    if (!this.props.catalog.searchResults || this.props.catalog.isSearching) {
      return  // No results are in
    }

    bbox = extentWrapped(this.map, bbox)

    let position
    if (this.props.catalog.searchResults.count) {
      // Pager
      position = OLExtent.getBottomRight(bbox)
      this.imageSearchResultsOverlay.setPosition(position)
      this.imageSearchResultsOverlay.setPositioning('top-right')
    } else {
      // No results
      position = OLExtent.getCenter(bbox)
      this.imageSearchResultsOverlay.setPosition(position)
      this.imageSearchResultsOverlay.setPositioning('center-center')
    }
    // HACK HACK HACK HACK HACK HACK HACK HACK

    if (autoPan) {
      // Only auto-pan if the overlay is outside of the view.
      const viewExtent = this.map.getView().calculateExtent(this.map.getSize())
      if (!OLExtent.containsCoordinate(viewExtent, position)) {
        this.map.getView().animate({
          center: position,
          duration: 1000,
        })
      }
    }
  }

  private renderImagerySearchBbox() {
    this.clearDraw()
    let bbox = deserializeBbox(this.props.map.bbox)
    if (!bbox || this.props.route.pathname !== '/create-job') {
      return
    }

    bbox = extentWrapped(this.map, bbox)

    const feature = new OLFeature({ geometry: OLPolygon.fromExtent(bbox) })
    this.drawLayer.getSource().addFeature(feature)
  }

  private renderSelectionPreview() {
    const features = (this.props.map.selectedFeature) ? [this.props.map.selectedFeature] : []
    const previewables = this.toPreviewable(features)

    // Remove currently rendered selection previews.
    Object.keys(this.previewLayers).forEach(imageId => {
      const layer = this.previewLayers[imageId]
      delete this.previewLayers[imageId]
      animateLayerExit(layer).then(() => { this.map.removeLayer(layer) })
    })

    // Render selection previews.
    const insertionIndex = this.basemapLayers.length
    previewables.forEach(f => {
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

      let layer: OLLayer

      if (provider.isXYZProvider) {
        layer = new OLTileLayer({
          source: generateXYZScenePreviewSource(provider, externalId, this.props.catalog.apiKey),
          extent: f.extentWrapped,
        })
      } else {
        layer = new OLImageLayer({
          source: generateImageStaticScenePreviewSource(provider, externalId, f.extentWrapped, this.props.catalog.apiKey),
        })
      }

      layer.setZIndex(1)

      this.subscribeToLoadEvents(layer)
      this.previewLayers[f.sceneId] = layer
      this.map.getLayers().insertAt(insertionIndex, layer)
    })
  }

  private toPreviewable(features: GeoJSON.Feature<any>[]) {
    return features.map(f => {
      return {
        sceneId: (f.properties && f.properties.type === TYPE_JOB) ? f.properties.scene_id : f.id,
        extent: featureToExtent(f),
        extentWrapped: featureToExtentWrapped(this.map, f),
      }
    })
  }

  private subscribeToLoadEvents(layer: OLLayer) {
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
      this.deactivateSelectInteraction()
      this.deactivateHoverInteraction(false)
      return
    }

    switch (this.props.map.mode) {
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
        this.deactivateBboxDrawInteraction()
        this.activateSelectInteraction()
        this.deactivateHoverInteraction()
        break
      case MODE_PRODUCT_LINES:
        this.deactivateBboxDrawInteraction()
        this.activateSelectInteraction()
        this.deactivateHoverInteraction()
        break
      default:
        console.warn('wat mode=%s', this.props.map.mode)
        break
    }
  }

  private updateSelectedFeature() {
    const features = this.selectInteraction.getFeatures()
    features.clear()

    if (!this.props.map.selectedFeature) {
      return  // Nothing to do
    }

    const reader = new OLGeoJSON()
    const feature = reader.readFeature(this.props.map.selectedFeature, {
      dataProjection: WGS84,
      featureProjection: WEB_MERCATOR,
    })
    const anchor = OLExtent.getTopRight(featureToExtentWrapped(this.map, this.props.map.selectedFeature))
    features.push(feature)
    this.featureDetailsOverlay.setPosition(anchor)
  }
}

function animateLayerExit(layer: OLLayer) {
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

function generateBasemapLayers(providers: BasemapTileProvider[]) {
  return providers.map((provider, index) => {
    const source = new OLXYZ({
      ...provider,
      crossOrigin: 'anonymous',
      tileLoadFunction,
    })
    const layer = new OLTileLayer({source})

    layer.setProperties({ name: provider.name, visible: index === 0 })

    return layer
  })
}

function generateBaseInteractions() {
  return OLInteraction.defaults().extend([
    new OLDragRotate({
      condition: OLCondition.altKeyOnly,
    }),
  ])
}

function generateControls() {
  return OLControl.defaults({
    attributionOptions: {
      collapsible: false,
    },
  }).extend([
    new OLScaleLine({
      minWidth: 250,
      units: 'nautical',
    }),
    new OLZoomSlider(),
    new OLMousePosition({
      coordinateFormat: OLCoordinate.toStringHDMS,
      projection: WGS84,
    }),
    new ExportControl(styles.export),
    new SearchControl(styles.search),
    new MeasureControl(styles.measure),
    new ScaleControl(styles.scale),
  ])
}

function generateDetectionsSource(wmsUrl: string, feature: beachfront.Job|beachfront.ProductLine) {
  return new OLTileWMS({
    tileLoadFunction: detectionTileLoadFunction,
    crossOrigin: 'anonymous',
    url: wmsUrl,
    projection: WEB_MERCATOR,
    params: {
      [KEY_LAYERS]: IDENTIFIER_DETECTIONS,
      [KEY_ENV]: (feature.properties.type === TYPE_JOB ? 'jobid:' : 'productlineid:') + getIdForFeature(feature),  // HACK
    },
  })
}

function getIdForFeature(feature: beachfront.Job|beachfront.ProductLine) {
  // If this is a Job that contains a Seed Job reference, use that Seed Job ID to get the detections
  const job = (feature as beachfront.Job)
  if ((job) && (job.properties.seed_job_id)) {
    return job.properties.seed_job_id
  }
  return feature.id
}

function generateDrawLayer() {
  return new OLVectorLayer({
    source: new OLVectorSource({
      wrapX: false,
    }),
    style: new OLStyle({
      fill: new OLFill({
        color: 'hsla(202, 70%, 50%, 0.35)',
      }),
      stroke: new OLStroke({
        color: 'hsla(202, 70%, 50%, 0.7)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })
}

function generateBboxDrawInteraction(drawLayer: OLVectorLayer) {
  const draw = new OLDraw({
    source: drawLayer.getSource(),
    maxPoints: 2,
    type: 'LineString',
    geometryFunction(coordinates: any, geometry: OLPolygon) {
      if (!geometry) {
        geometry = new OLPolygon(null as any)
      }
      const [[x1, y1], [x2, y2]] = coordinates
      geometry.setCoordinates([[[x1, y1], [x1, y2], [x2, y2], [x2, y1], [x1, y1]]])
      return geometry
    },
    style: new OLStyle({
      image: new OLRegularShape({
        stroke: new OLStroke({
          color: 'black',
          width: 1,
        }),
        points: 4,
        radius: 15,
        radius2: 0,
        angle: 0,
      }),
      fill: new OLFill({
        color: 'hsla(202, 70%, 50%, .6)',
      }),
      stroke: new OLStroke({
        color: 'hsl(202, 70%, 50%)',
        width: 1,
        lineDash: [5, 5],
      }),
    }),
  })

  draw.setActive(false)

  return draw
}

function generateFeatureDetailsOverlay(componentRef: ReactInstance) {
  return new OLOverlay({
    element:     findDOMNode(componentRef) as Element,
    id:          'featureDetails',
    positioning: 'top-left',
    stopEvent:   false,
  })
}

function generateHighlightLayer() {
  return new OLVectorLayer({
    source: new OLVectorSource(),
    style: new OLStyle({
      fill: new OLFill({
        color: 'hsla(90, 100%, 30%, .5)',
      }),
      stroke: new OLStroke({
        color: 'hsla(90, 100%, 30%, .6)',
      }),
    }),
  })
}

function generateHoverInteraction(...layers: OLLayer[]) {
  return new OLSelect({
    layers,
    multi: true,
    condition: e => OLCondition.pointerMove(e) && OLCondition.noModifierKeys(e),
    style: new OLStyle({
      stroke: new OLStroke({
        color: 'hsla(200, 70%, 90%, 0.8)',
        width: 4,
      }),
    }),
  })
}

function generateFrameLayer() {
  const layer = new OLVectorLayer({
    source: new OLVectorSource(),
  })

  layer.setZIndex(2)

  return layer
}

function generateFrameFillLayer() {
  return new OLVectorLayer({
    source: new OLVectorSource(),
  })
}

function generatePinLayer() {
  const layer = new OLVectorLayer({
    source: new OLVectorSource(),
  })

  layer.setZIndex(3)

  return layer
}

function generateImageryLayer() {
  return new OLVectorLayer({
    source: new OLVectorSource({ features: new OLCollection() }),
    style: new OLStyle({
      fill: new OLFill({
        color: 'rgba(0, 0, 0, 0.08)',
      }),
      stroke: new OLStroke({
        color: 'rgba(0, 0, 0, 0.32)',
        width: 1,
      }),
    }),
  })
}

function generateImageSearchResultsOverlay(componentRef: ReactInstance) {
  return new OLOverlay({
    element:   findDOMNode(componentRef) as Element,
    id:        'imageSearchResults',
    stopEvent: false,
  })
}

function generateXYZScenePreviewSource(provider: SceneTileProvider, imageId: string, apiKey: string) {
  return new OLXYZ({
    ...provider,
    crossOrigin: 'anonymous',
    tileLoadFunction,
    url: provider.url.replace('__SCENE_ID__', imageId).replace('__API_KEY__', apiKey),
    maxZoom: 12,
  })
}

function generateImageStaticScenePreviewSource(provider: SceneTileProvider, imageId: string, extent: Extent, apiKey: string) {
  return new OLImageStatic({
    ...provider,
    crossOrigin: 'anonymous',
    imageLoadFunction: tileLoadFunction as ImageLoadFunctionType,
    projection: WEB_MERCATOR,
    url: provider.url.replace('__SCENE_ID__', imageId).replace('__API_KEY__', apiKey),
    imageExtent: extent,
  })
}

function generateSelectInteraction(...layers: OLLayer[]) {
  return new OLSelect({
    layers,
    multi: true,
    condition: e => OLCondition.click(e) && (
      OLCondition.noModifierKeys(e) || OLCondition.shiftKeyOnly(e)
    ),
    style: (feature: OLFeature) => {
      switch (feature.get(KEY_TYPE)) {
        case TYPE_JOB:
          return new OLStyle()
        default:
          return new OLStyle({
            stroke: new OLStroke({
              color: 'black',
              width: 2,
            }),
          })
      }
    },
    toggleCondition: OLCondition.never,
    filter: (feature: OLFeature) => {
      return isFeatureTypeSelectable(feature)
    },
  })
}

function getColorForStatus(status: string) {
  switch (status) {
    case STATUS_ACTIVE: return 'hsl(200, 94%, 54%)'
    case STATUS_SUBMITTED:
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

function isFeatureTypeSelectable(feature: OLFeature) {
  switch (feature.get(KEY_TYPE)) {
    // Ignore the selection events for inboard divots and stems
    case TYPE_DIVOT_INBOARD:
    case TYPE_STEM:
      return false
    default:
      return true
  }
}

function tileLoadFunction(imageTile: ImageTile, src: string) {
  const image = imageTile.getImage() as any

  if (imageTile.loadingError) {
    delete imageTile.loadingError
    image.src = tileErrorPlaceholder
  } else {
    image.src = src
  }
}

function detectionTileLoadFunction(imageTile: ImageTile, src: string) {
  const image = imageTile.getImage() as any

  if (imageTile.loadingError) {
    delete imageTile.loadingError
    image.src = tileErrorPlaceholder
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
      image.src = urlCreator.createObjectURL(blob)
    }
    client.send()
  }
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp(name + '=([^;]+)'))
  if (match) {
    return match[1]
  }
  return null
}

function mapStateToProps(state: AppState) {
  return {
    route: state.route,
    catalog: state.catalog,
    map: state.map,
    jobs: state.jobs,
    apiStatus: state.apiStatus,
  }
}

function mapDispatchToProps(dispatch: Function) {
  return {
    actions: {
      map: {
        initialized: (map: OLMap, collections: MapCollections) => dispatch(mapActions.initialized(map, collections)),
        updateBbox: (bbox: Extent | null) => dispatch(mapActions.updateBbox(bbox)),
        updateView: (view: MapView) => dispatch(mapActions.updateView(view)),
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(mapActions.setSelectedFeature(feature)),
      },
      catalog: {
        search: (args?: CatalogSearchArgs) => dispatch(catalogActions.search(args)),
      },
      user: {
        logout: () => dispatch(userActions.logout()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(PrimaryMap)
