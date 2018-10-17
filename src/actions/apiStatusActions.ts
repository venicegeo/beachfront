
import {getClient} from '../api/session'
import {AppState} from '../store'

export const types = {
  API_STATUS_FETCHING: 'API_STATUS_FETCHING',
  API_STATUS_FETCH_SUCCESS: 'API_STATUS_FETCH_SUCCESS',
  API_STATUS_FETCH_ERROR: 'API_STATUS_FETCH_ERROR',
  API_STATUS_SERIALIZED: 'API_STATUS_SERIALIZED',
  API_STATUS_DESERIALIZED: 'API_STATUS_DESERIALIZED',
}

interface ApiStatus {
  geoserver: string
  'geoserver-upstream': string
  'enabled-platforms': string[]
  'outstanding-jobs': number
  uptime: number
}

export const apiStatusActions = {
  fetch() {
    return async dispatch => {
      dispatch({ type: types.API_STATUS_FETCHING })

      try {
        const response = await getClient().get('/')
        const status = response.data as ApiStatus
        dispatch({
          type: types.API_STATUS_FETCH_SUCCESS,
          geoserver: {
            wmsUrl: status.geoserver + '/wms',
          },
          enabledPlatforms: status['enabled-platforms'],
        })
      } catch (error) {
        dispatch({
          type: types.API_STATUS_FETCH_ERROR,
          error,
        })
      }
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      sessionStorage.setItem('geoserver', JSON.stringify(state.apiStatus.geoserver))
      sessionStorage.setItem('enabled_platforms_records', JSON.stringify(state.apiStatus.enabledPlatforms))

      dispatch({ type: types.API_STATUS_SERIALIZED })
    }
  },

  deserialize() {
    return {
      type: types.API_STATUS_DESERIALIZED,
      state: {
        geoserver: JSON.parse(sessionStorage.getItem('geoserver')),
        enabledPlatforms: JSON.parse(sessionStorage.getItem('enabled_platforms_records')),
      },
    }
  },
}
