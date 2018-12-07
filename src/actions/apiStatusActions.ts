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

import {getClient} from '../api/session'
import {AppState} from '../store'
import {apiStatusInitialState} from '../reducers/apiStatusReducer'

export const apiStatusTypes = {
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
      dispatch({ type: apiStatusTypes.API_STATUS_FETCHING })

      try {
        const response = await getClient().get('/')
        const status = response.data as ApiStatus
        dispatch({
          type: apiStatusTypes.API_STATUS_FETCH_SUCCESS,
          geoserver: {
            wmsUrl: status.geoserver + '/wms',
          },
          enabledPlatforms: status['enabled-platforms'],
        })
      } catch (error) {
        dispatch({
          type: apiStatusTypes.API_STATUS_FETCH_ERROR,
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

      dispatch({ type: apiStatusTypes.API_STATUS_SERIALIZED })
    }
  },

  deserialize() {
    const deserialized: any = {}

    try {
      deserialized.geoserver = JSON.parse(sessionStorage.getItem('geoserver') || 'null') || apiStatusInitialState.geoserver
    } catch (error) {
      console.warn('Failed to deserialize "geoserver"')
    }

    try {
      deserialized.enabledPlatforms = JSON.parse(sessionStorage.getItem('enabled_platforms_records') || 'null') || apiStatusInitialState.enabledPlatforms
    } catch (error) {
      console.warn('Failed to deserialize "enabled_platforms_records"')
    }

    return {
      type: apiStatusTypes.API_STATUS_DESERIALIZED,
      deserialized,
    }
  },
}
