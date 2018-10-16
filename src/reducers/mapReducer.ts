
import {shouldSelectedFeatureAutoDeselect, types} from '../actions/mapActions'
import {MapView, MODE_NORMAL} from '../components/PrimaryMap'
import ol from '../utils/ol'
import {TYPE_JOB} from '../constants'

export interface MapState {
  map: ol.Map | null
  view: MapView | null
  mode: string
  detections: (beachfront.Job | beachfront.ProductLine)[]
  frames: (beachfront.Job | beachfront.ProductLine)[]
  bbox: [number, number, number, number] | null
  hoveredFeature: beachfront.Job | null
  collections: any | null
  selectedFeature: beachfront.Job | beachfront.Scene | null
}

export const mapInitialState: MapState = {
  map: null,
  mode: MODE_NORMAL,
  view: null,
  detections: [],
  frames: [],
  bbox: null,
  hoveredFeature: null,
  collections: null,
  selectedFeature: null,
}

export function mapReducer(state = mapInitialState, action: any) {
  switch (action.type) {
    case types.MAP_INITIALIZED:
      return {
        ...state,
        map: action.map,
        collections: action.collections,
      }
    case types.MAP_DESERIALIZED:
      return {
        ...state,
        ...action.state,
      }
    case types.MAP_MODE_UPDATED:
      return {
        ...state,
        mode: action.mode,
      }
    case types.MAP_BBOX_UPDATED:
      return {
        ...state,
        bbox: action.bbox,
      }
    case types.MAP_BBOX_CLEARED: {
      let selectedFeature = state.selectedFeature
      if (shouldSelectedFeatureAutoDeselect(selectedFeature, { ignoreTypes: [TYPE_JOB] })) {
        selectedFeature = null
      }

      return {
        ...state,
        bbox: null,
        searchResults: null,
        searchError: null,
        selectedFeature,
      }
    }
    case types.MAP_DETECTIONS_UPDATED:
      return {
        ...state,
        detections: action.detections,
      }
    case types.MAP_FRAMES_UPDATED:
      return {
        ...state,
        frames: action.frames,
      }
    case types.MAP_SELECTED_FEATURE_UPDATED:
      return {
        ...state,
        selectedFeature: action.selectedFeature,
      }
    case types.MAP_HOVERED_FEATURE_UPDATED:
      return {
        ...state,
        hoveredFeature: action.hoveredFeature,
      }
    case types.MAP_VIEW_UPDATED:
      return {
        ...state,
        view: action.view,
      }
    case types.MAP_PAN_TO_POINT:
      return {
        ...state,
        view: {
          ...state.view,
          center: action.point,
          zoom: action.zoom,
          extent: null,
        },
      }
    case types.MAP_PAN_TO_EXTENT:
      return {
        ...state,
        view: {
          ...state.view,
          extent: action.extent,
          center: null,
          zoom: null,
        },
      }
    default:
      return state
  }
}
