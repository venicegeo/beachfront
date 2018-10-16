
import {types} from '../actions/algorithmsActions'

export interface AlgorithmsState {
  records: beachfront.Algorithm[]
  fetching: boolean
  fetchError: any
}

export const algorithmsInitialState: AlgorithmsState = {
  records: [],
  fetching: false,
  fetchError: null,
}

export function algorithmsReducer(state = algorithmsInitialState, action: any) {
  switch (action.type) {
    case types.ALGORITHMS_DESERIALIZED:
      return {
        ...state,
        ...action.state,
      }
    case types.ALGORITHMS_FETCHING:
      return {
        ...state,
        fetching: true,
        fetchError: false,
      }
    case types.ALGORITHMS_FETCH_SUCCESS:
      return {
        ...state,
        fetching: false,
        records: action.records,
      }
    case types.ALGORITHMS_FETCH_ERROR:
      return {
        ...state,
        fetching: false,
        fetchError: action.error,
      }
    default:
      return state
  }
}
