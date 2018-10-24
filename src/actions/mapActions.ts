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

import {MapView, MODE_DRAW_BBOX, MODE_NORMAL, MODE_PRODUCT_LINES, MODE_SELECT_IMAGERY} from '../components/PrimaryMap'
import {wrap} from '../utils/math'
import {AppState} from '../store'
import {TYPE_JOB} from '../constants'

export const types = {
  MAP_INITIALIZED: 'MAP_INITIALIZED',
  MAP_MODE_UPDATED: 'MAP_MODE_UPDATED',
  MAP_DETECTIONS_UPDATED: 'MAP_DETECTIONS_UPDATED',
  MAP_FRAMES_UPDATED: 'MAP_FRAMES_UPDATED',
  MAP_BBOX_UPDATED: 'MAP_BBOX_UPDATED',
  MAP_BBOX_CLEARED: 'MAP_BBOX_CLEARED',
  MAP_SELECTED_FEATURE_UPDATED: 'MAP_SELECTED_FEATURE_UPDATED',
  MAP_HOVERED_FEATURE_UPDATED: 'MAP_HOVERED_FEATURE_UPDATED',
  MAP_VIEW_UPDATED: 'MAP_VIEW_UPDATED',
  MAP_PAN_TO_POINT: 'MAP_PAN_TO_POINT',
  MAP_PAN_TO_EXTENT: 'MAP_PAN_TO_EXTENT',
  MAP_SERIALIZED: 'MAP_SERIALIZED',
  MAP_DESERIALIZED: 'MAP_DESERIALIZED',
}

export interface ParamsMapPanToPoint {
  point: [number, number]
  zoom?: number
}

export const mapActions = {
  initialized(map: ol.Map, collections: any) {
    return {
      type: types.MAP_INITIALIZED,
      map,
      collections,
    }
  },

  updateMode() {
    return (dispatch, getState) => {
      const state: AppState = getState()

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

      dispatch({
        type: types.MAP_MODE_UPDATED,
        mode,
      })
    }
  },

  updateBbox(bbox: [number, number, number, number]) {
    return {
      type: types.MAP_BBOX_UPDATED,
      bbox,
    }
  },

  clearBbox() {
    return { type: types.MAP_BBOX_CLEARED }
  },

  updateDetections() {
    return (dispatch, getState) => {
      const state: AppState = getState()

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
        dispatch({
          type: types.MAP_DETECTIONS_UPDATED,
          detections,
        })
      }
    }
  },

  updateFrames() {
    return (dispatch, getState) => {
      const state: AppState = getState()

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
        dispatch({
          type: types.MAP_FRAMES_UPDATED,
          frames,
        })
      }
    }
  },

  setSelectedFeature(feature: GeoJSON.Feature<any> | null) {
    return (dispatch, getState) => {
      const state: AppState = getState()

      if (state.map.selectedFeature === feature) {
        return  // Nothing to do
      }

      dispatch({
        type: types.MAP_SELECTED_FEATURE_UPDATED,
        selectedFeature: feature,
      })
    }
  },

  setHoveredFeature(hoveredFeature: beachfront.Job | null) {
    return {
      type: types.MAP_HOVERED_FEATURE_UPDATED,
      hoveredFeature,
    }
  },

  updateView(view: MapView) {
    return {
      type: types.MAP_VIEW_UPDATED,
      view,
    }
  },

  panToPoint(args: ParamsMapPanToPoint) {
    args.zoom = args.zoom || 10

    return {
      type: types.MAP_PAN_TO_POINT,
      point: args.point,
      zoom: args.zoom,
    }
  },

  panToExtent(extent: [number, number, number, number]) {
    return {
      type: types.MAP_PAN_TO_EXTENT,
      extent,
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      /*
      Wrap map center to keep it within the -180/180 range. Otherwise the map may scroll awkardly on initial load to get
      back to a far away location. Do the same for the bbox so that it's in the same starting location as the map.
     */
      let mapView = null
      if (state.map.view) {
        mapView = {...state.map.view}
        if (mapView.center) {
          mapView.center[0] = wrap(mapView.center[0], -180, 180)
        }
      }

      let bbox = null
      if (state.map.bbox) {
        bbox = [...state.map.bbox]
        const bboxWidth = bbox[2] - bbox[0]
        bbox[0] = wrap(bbox[0], -180, 180)
        bbox[2] = bbox[0] + bboxWidth
      }

      sessionStorage.setItem('bbox', JSON.stringify(bbox))
      sessionStorage.setItem('mapView', JSON.stringify(mapView))

      dispatch({ type: types.MAP_SERIALIZED })
    }
  },

  deserialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      let selectedFeature = null
      const [jobId] = state.route.jobIds
      if (jobId) {
        // This code should never find a selected feature since no jobs have been loaded.
        selectedFeature = state.jobs.records.find(j => j.id === jobId) || null
      }

      dispatch({
        type: types.MAP_DESERIALIZED,
        state: {
          selectedFeature,
          bbox: JSON.parse(sessionStorage.getItem('bbox')),
          mapView: JSON.parse(sessionStorage.getItem('mapView')),
        },
      })
    }
  },
}
