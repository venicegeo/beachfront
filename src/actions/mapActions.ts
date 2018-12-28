/**
 * Copyright 2018, RadiantBlue Technologies, Inc.
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

import {GeoJSON} from 'geojson'
import {MapView, MODE_DRAW_BBOX, MODE_NORMAL, MODE_PRODUCT_LINES, MODE_SELECT_IMAGERY} from '../components/PrimaryMap'
import {wrap} from '../utils/math'
import {AppState} from '../store'
import {Extent, Point} from '../utils/geometries'
import {Action, Dispatch} from 'redux'
import {MapCollections, mapInitialState, MapState} from '../reducers/mapReducer'

export namespace Map {
  export function initialized(map: ol.Map, collections: MapCollections) {
    return {...new MapActions.Initialized({
      map,
      collections,
    })}
  }

  export function updateMode() {
    return (dispatch: Dispatch<MapState>, getState: () => AppState) => {
      const state = getState()

      let mode: string
      switch (state.route.pathname) {
        case '/create-job':
          mode = state.map.bbox && state.catalog.searchResults ? MODE_SELECT_IMAGERY : MODE_DRAW_BBOX
          break
        case '/create-product-line':
          mode = MODE_DRAW_BBOX
          break
        case '/product-lines':
          mode = MODE_PRODUCT_LINES
          break
        default:
          mode = MODE_NORMAL
      }

      dispatch({...new MapActions.ModeUpdated({ mode })})
    }
  }

  export function updateBbox(bbox: Extent | null) {
    return {...new MapActions.BboxUpdated({ bbox })}
  }

  export function clearBbox() {
    return {...new MapActions.BboxCleared()}
  }

  export function updateDetections() {
    return (dispatch: Dispatch<MapState>, getState: () => AppState) => {
      const state = getState()

      let detections: beachfront.Job[] | beachfront.ProductLine[]
      switch (state.route.pathname) {
        case '/create-product-line':
        case '/product-lines':
          detections = state.map.selectedFeature ? [state.map.selectedFeature as any] : state.productLines.records
          break
        default:
          detections = state.jobs.records.filter(j => state.route.jobIds.includes(j.id))
      }

      // Only update state if detections have changed so that we can avoid unnecessary redrawing.
      let detectionsChanged = false
      if (detections.length !== state.map.detections.length) {
        detectionsChanged = true
      } else {
        for (let i = 0; i < detections.length; i++) {
          if (detections[i] !== state.map.detections[i]) {
            detectionsChanged = true
            break
          }
        }
      }

      if (detectionsChanged) {
        dispatch({...new MapActions.DetectionsUpdated({ detections })})
      }
    }
  }

  export function updateFrames() {
    return (dispatch: Dispatch<MapState>, getState: () => AppState) => {
      const state = getState()

      let frames: beachfront.Job[] | beachfront.ProductLine[]
      switch (state.route.pathname) {
        case '/create-product-line':
        case '/product-lines':
          frames = [state.map.selectedFeature as any, ...state.productLines.records].filter(Boolean)
          break
        default:
          frames = state.jobs.records
      }

      // Only update state if frames have changed so that we can avoid unnecessary redrawing.
      let framesChanged = false
      if (frames.length !== state.map.frames.length) {
        framesChanged = true
      } else {
        for (let i = 0; i < frames.length; i++) {
          if (frames[i] !== state.map.frames[i]) {
            framesChanged = true
            break
          }
        }
      }

      if (framesChanged) {
        dispatch({...new MapActions.FramesUpdated({ frames })})
      }
    }
  }

  export function setSelectedFeature(feature: GeoJSON.Feature<any> | null) {
    return (dispatch: Dispatch<MapState>, getState: () => AppState) => {
      const state = getState()

      if (state.map.selectedFeature === feature) {
        return  // Nothing to do
      }

      dispatch({...new MapActions.SelectedFeatureUpdated({
        selectedFeature: feature,
      })})
    }
  }

  export function setHoveredFeature(hoveredFeature: beachfront.Job | null) {
    return {...new MapActions.HoveredFeatureUpdated({ hoveredFeature })}
  }

  export function updateView(view: MapView) {
    return {...new MapActions.ViewUpdated({ view })}
  }

  export function panToPoint({ point, zoom = 10 }: { point: Point, zoom?: number }) {
    return {...new MapActions.PanToPoint({
      point,
      zoom,
    })}
  }

  export function panToExtent(extent: Extent) {
    return {...new MapActions.PanToExtent({ extent })}
  }

  export function serialize() {
    return (dispatch: Dispatch<MapState>, getState: () => AppState) => {
      const state = getState()

      /*
      Wrap map center to keep it within the -180/180 range. Otherwise the map may scroll awkardly on initial load to get
      back to a far away location. Do the same for the bbox so that it's in the same starting location as the map.
     */
      let mapView: MapView | null = null
      if (state.map.view) {
        mapView = { ...state.map.view }
        if (mapView.center) {
          mapView.center[0] = wrap(mapView.center[0], -180, 180)
        }
      }

      let bbox: Extent | null = null
      if (state.map.bbox) {
        bbox = [...state.map.bbox] as Extent
        const bboxWidth = bbox[2] - bbox[0]
        bbox[0] = wrap(bbox[0], -180, 180)
        bbox[2] = bbox[0] + bboxWidth
      }

      sessionStorage.setItem('bbox', JSON.stringify(bbox))
      sessionStorage.setItem('mapView', JSON.stringify(mapView))

      dispatch({...new MapActions.Serialized()})
    }
  }

  export function deserialize() {
    let bbox: Extent | null = null
    try {
      bbox = JSON.parse(sessionStorage.getItem('bbox') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "bbox"')
    }

    let view: MapView | null = null
    try {
      view = JSON.parse(sessionStorage.getItem('mapView') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "mapView"')
    }

    return {...new MapActions.Deserialized({
      bbox,
      view,
    })}
  }
}

export namespace MapActions {
  export class Initialized implements Action {
    static type = 'MAP_INITIALIZED'
    type = Initialized.type
    constructor(public payload: {
      map: NonNullable<typeof mapInitialState.map>
      collections: NonNullable<typeof mapInitialState.collections>
    }) {}
  }

  export class ModeUpdated implements Action {
    static type = 'MAP_MODE_UPDATED'
    type = ModeUpdated.type
    constructor(public payload: {
      mode: typeof mapInitialState.mode
    }) {}
  }

  export class DetectionsUpdated implements Action {
    static type = 'MAP_DETECTIONS_UPDATED'
    type = DetectionsUpdated.type
    constructor(public payload: {
      detections: typeof mapInitialState.detections
    }) {}
  }

  export class FramesUpdated implements Action {
    static type = 'MAP_FRAMES_UPDATED'
    type = FramesUpdated.type
    constructor(public payload: {
      frames: typeof mapInitialState.frames
    }) {}
  }

  export class BboxUpdated implements Action {
    static type = 'MAP_BBOX_UPDATED'
    type = BboxUpdated.type
    constructor(public payload: {
      bbox: typeof mapInitialState.bbox
    }) {}
  }

  export class BboxCleared implements Action {
    static type = 'MAP_BBOX_CLEARED'
    type = BboxCleared.type
  }

  export class SelectedFeatureUpdated implements Action {
    static type = 'MAP_SELECTED_FEATURE_UPDATED'
    type = SelectedFeatureUpdated.type
    constructor(public payload: {
      selectedFeature: typeof mapInitialState.selectedFeature
    }) {}
  }

  export class HoveredFeatureUpdated implements Action {
    static type = 'MAP_HOVERED_FEATURE_UPDATED'
    type = HoveredFeatureUpdated.type
    constructor(public payload: {
      hoveredFeature: typeof mapInitialState.hoveredFeature
    }) {}
  }

  export class ViewUpdated implements Action {
    static type = 'MAP_VIEW_UPDATED'
    type = ViewUpdated.type
    constructor(public payload: {
      view: NonNullable<typeof mapInitialState.view>
    }) {}
  }

  export class PanToPoint implements Action {
    static type = 'MAP_PAN_TO_POINT'
    type = PanToPoint.type
    constructor(public payload: {
      point: Point
      zoom: number
    }) {}
  }

  export class PanToExtent implements Action {
    static type = 'MAP_PAN_TO_EXTENT'
    type = PanToExtent.type
    constructor(public payload: {
      extent: Extent
    }) {}
  }

  export class Serialized implements Action {
    static type = 'MAP_SERIALIZED'
    type = Serialized.type
  }

  export class Deserialized implements Action {
    static type = 'MAP_DESERIALIZED'
    type = Deserialized.type
    constructor(public payload: {
      bbox: typeof mapInitialState.bbox
      view: typeof mapInitialState.view
    }) {}
  }
}
