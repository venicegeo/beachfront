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

import {types} from '../actions/apiStatusActions'

export interface ApiStatusState {
  geoserver: {
    wmsUrl: string | null
  }
  enabledPlatforms: string[]
  isFetching: boolean
  fetchError: any
}

export const apiStatusInitialState: ApiStatusState = {
  geoserver: {
    wmsUrl: null,
  },
  enabledPlatforms: [],
  isFetching: false,
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
        isFetching: true,
        fetchError: null,
      }
    case types.API_STATUS_FETCH_SUCCESS:
      return {
        ...state,
        isFetching: false,
        geoserver: action.geoserver,
        enabledPlatforms: action.enabledPlatforms,
      }
    case types.API_STATUS_FETCH_ERROR:
      return {
        ...state,
        isFetching: false,
        fetchError: action.error,
      }
    default:
      return state
  }
}
