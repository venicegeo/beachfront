
import {getApiStatus} from '../api/status'
import {AppState} from '../store'

export const types = {
  ENABLED_PLATFORMS_FETCHING: 'ENABLED_PLATFORMS_FETCHING',
  ENABLED_PLATFORMS_FETCH_SUCCESS: 'ENABLED_PLATFORMS_FETCH_SUCCESS',
  ENABLED_PLATFORMS_FETCH_ERROR: 'ENABLED_PLATFORMS_FETCH_ERROR',
  ENABLED_PLATFORMS_SERIALIZED: 'ENABLED_PLATFORMS_SERIALIZED',
  ENABLED_PLATFORMS_DESERIALIZED: 'ENABLED_PLATFORMS_DESERIALIZED',
}

export const enabledPlatformsActions = {
  fetch() {
    return async dispatch => {
      dispatch({ type: types.ENABLED_PLATFORMS_FETCHING })

      try {
        const status = await getApiStatus()
        dispatch({
          type: types.ENABLED_PLATFORMS_FETCH_SUCCESS,
          records: status['enabled-platforms']
        })
      } catch (error) {
        dispatch({
          type: types.ENABLED_PLATFORMS_FETCH_ERROR,
          error,
        })
      }
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      sessionStorage.setItem('enabled_platforms_records', JSON.stringify(state.enabledPlatforms.records))

      dispatch({ type: types.ENABLED_PLATFORMS_SERIALIZED })
    }
  },

  deserialize() {
    return {
      type: types.ENABLED_PLATFORMS_DESERIALIZED,
      state: {
        records: JSON.parse(sessionStorage.getItem('enabled_platforms_records')),
      }
    }
  },
}
