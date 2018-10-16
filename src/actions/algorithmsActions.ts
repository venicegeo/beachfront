
import {ALGORITHM_ENDPOINT} from '../config'
import {getClient} from '../api/session'
import {AppState} from '../store'

export const types = {
  ALGORITHMS_FETCHING: 'ALGORITHMS_FETCHING',
  ALGORITHMS_FETCH_SUCCESS: 'ALGORITHMS_FETCH_SUCCESS',
  ALGORITHMS_FETCH_ERROR: 'ALGORITHMS_FETCH_ERROR',
  ALGORITHMS_SERIALIZED: 'ALGORITHMS_SERIALIZED',
  ALGORITHMS_DESERIALIZED: 'ALGORITHMS_DESERIALIZED',
}

export const algorithmsActions = {
  fetch() {
    return async dispatch => {
      try {
        const response = await getClient().get(ALGORITHM_ENDPOINT)
        dispatch({
          type: types.ALGORITHMS_FETCH_SUCCESS,
          records: response.data.algorithms.map(record => ({
            description: record.description,
            id: record.service_id,
            maxCloudCover: record.max_cloud_cover,
            name: record.name,
            type: record.interface,
          })),
        })
      } catch (error) {
        dispatch({
          type: types.ALGORITHMS_FETCH_ERROR,
          error,
        })
      }
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      sessionStorage.setItem('algorithms_records', JSON.stringify(state.algorithms.records))

      dispatch({ type: types.ALGORITHMS_SERIALIZED })
    }
  },

  deserialize() {
    return {
      type: types.ALGORITHMS_DESERIALIZED,
      state: {
        records: JSON.parse(sessionStorage.getItem('algorithms_records')),
      },
    }
  },
}
