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

import {Action, Dispatch} from 'redux'
import {getClient} from '../api/session'
import {AppState} from '../store'
import {apiStatusInitialState, ApiStatusState} from '../reducers/apiStatusReducer'

export namespace ApiStatus {
  export function fetch() {
    return async (dispatch: Dispatch<ApiStatusState>) => {
      dispatch({...new ApiStatusActions.Fetching()})

      try {
        const response = await getClient().get('/') as FetchResponse
        dispatch({...new ApiStatusActions.FetchSuccess({
          geoserver: {
            wmsUrl: response.data.geoserver + '/wms',
          },
          enabledPlatforms: response.data['enabled-platforms'],
        })})
      } catch (error) {
        dispatch({...new ApiStatusActions.FetchError({ error })})
      }
    }
  }

  export function serialize() {
    return (dispatch: Dispatch<ApiStatusState>, getState: () => AppState) => {
      const state = getState()

      sessionStorage.setItem('geoserver', JSON.stringify(state.apiStatus.geoserver))
      sessionStorage.setItem('enabled_platforms_records', JSON.stringify(state.apiStatus.enabledPlatforms))

      dispatch({...new ApiStatusActions.Serialized()})
    }
  }

  export function deserialize() {
    let geoserver: typeof apiStatusInitialState.geoserver | null = null
    try {
      geoserver = JSON.parse(sessionStorage.getItem('geoserver') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "geoserver"')
    }

    let enabledPlatforms: typeof apiStatusInitialState.enabledPlatforms | null = null
    try {
      enabledPlatforms = JSON.parse(sessionStorage.getItem('enabled_platforms_records') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "enabled_platforms_records"')
    }

    return {...new ApiStatusActions.Deserialized({
      geoserver: geoserver || apiStatusInitialState.geoserver,
      enabledPlatforms: enabledPlatforms || apiStatusInitialState.enabledPlatforms,
    })}
  }
}

export namespace ApiStatusActions {
  export class Fetching implements Action {
    static type = 'API_STATUS_FETCHING'
    type = Fetching.type
  }

  export class FetchSuccess implements Action {
    static type = 'API_STATUS_FETCH_SUCCESS'
    type = FetchSuccess.type
    constructor(public payload: {
      geoserver: typeof apiStatusInitialState.geoserver
      enabledPlatforms: typeof apiStatusInitialState.enabledPlatforms
    }) {}
  }

  export class FetchError implements Action {
    static type = 'API_STATUS_FETCH_ERROR'
    type = FetchError.type
    constructor(public payload: {
      error: typeof apiStatusInitialState.fetchError
    }) {}
  }

  export class Serialized implements Action {
    static type = 'API_STATUS_SERIALIZED'
    type = Serialized.type
  }

  export class Deserialized implements Action {
    static type = 'API_STATUS_DESERIALIZED'
    type = Deserialized.type
    constructor(public payload: {
      geoserver: typeof apiStatusInitialState.geoserver
      enabledPlatforms: typeof apiStatusInitialState.enabledPlatforms
    }) {}
  }
}

interface FetchResponse {
  data: {
    geoserver: string
    'geoserver-upstream': string
    'enabled-platforms': string[]
    'outstanding-jobs': number
    uptime: number
  }
}
