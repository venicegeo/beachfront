
import {types} from '../actions/enabledPlatformsActions'

export interface EnabledPlatformsState {
  records: string[]
  fetching: boolean
  fetchError: any
}

export const enabledPlatformsInitialState: EnabledPlatformsState = {
  records: [],
  fetching: false,
  fetchError: null,
}

export function enabledPlatformsReducer(state = enabledPlatformsInitialState, action: any) {
  switch (action.type) {
    case types.ENABLED_PLATFORMS_DESERIALIZED:
      return {
        ...state,
        ...action.state,
      }
    case types.ENABLED_PLATFORMS_FETCHING:
      return {
        ...state,
        fetching: true,
        fetchError: null,
      }
    case types.ENABLED_PLATFORMS_FETCH_SUCCESS:
      return {
        ...state,
        fetching: false,
        records: action.records,
      }
    case types.ENABLED_PLATFORMS_FETCH_ERROR:
      return {
        ...state,
        fetching: false,
        fetchError: action.error,
      }
    default:
      return state
  }
}
