/*
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
 */

import {apiStatusInitialState, apiStatusReducer} from '../../src/reducers/apiStatusReducer'
import {ApiStatusActions} from '../../src/actions/apiStatusActions'

describe('apiStatusReducer', () => {
  test('initial state', () => {
    expect(apiStatusReducer(undefined, { type: null })).toEqual(apiStatusInitialState)
  })

  test('API_STATUS_FETCHING', () => {
    const state = {
      ...apiStatusInitialState,
      fetchError: 'a',
    }

    const action = { type: ApiStatusActions.Fetching.type }

    expect(apiStatusReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  test('API_STATUS_FETCH_SUCCESS', () => {
    const state = {
      ...apiStatusInitialState,
      isFetching: true,
    }

    const action = {
      type: ApiStatusActions.FetchSuccess.type,
      payload: {
        geoserver: {
          wmsUrl: 'a',
        },
        enabledPlatforms: ['a', 'b', 'c'],
      },
    }

    expect(apiStatusReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      geoserver: action.payload.geoserver,
      enabledPlatforms: action.payload.enabledPlatforms,
    })
  })

  test('API_STATUS_FETCH_ERROR', () => {
    const state = {
      ...apiStatusInitialState,
      isFetching: true,
    }

    const action = {
      type: ApiStatusActions.FetchError.type,
      payload: {
        error: 'a',
      },
    }

    expect(apiStatusReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.payload.error,
    })
  })

  test('API_STATUS_DESERIALIZED', () => {
    const action = {
      type: ApiStatusActions.Deserialized.type,
      payload: {
        geoserver: 'a',
        enabledPlatforms: 'b',
      },
    }

    expect(apiStatusReducer(apiStatusInitialState, action)).toEqual({
      ...apiStatusInitialState,
      geoserver: action.payload.geoserver,
      enabledPlatforms: action.payload.enabledPlatforms,
    })
  })
})
