
import {types} from '../actions/apiStatusActions'

export interface ApiStatusState {
  geoserver: {
    wmsUrl: string | null
  }
  enabledPlatforms: string[]
  fetching: boolean
  fetchError: any
}

export const apiStatusInitialState: ApiStatusState = {
  geoserver: {
    wmsUrl: null,
  },
  enabledPlatforms: [],
  fetching: false,
  fetchError: null,
}

export function apiStatusReducer(state = apiStatusInitialState, action: any) {
  switch (action.type) {
    case types.API_STATUS_DESERIALIZED:
      return {
        ...state,
        ...action.state,
      }
    case types.API_STATUS_FETCHING:
      return {
        ...state,
        fetching: true,
        fetchError: null,
      }
    case types.API_STATUS_FETCH_SUCCESS:
      return {
        ...state,
        fetching: false,
        geoserver: action.geoserver,
        enabledPlatforms: action.enabledPlatforms,
      }
    case types.API_STATUS_FETCH_ERROR:
      return {
        ...state,
        fetching: false,
        fetchError: action.error,
      }
    default:
      return state
  }
}
