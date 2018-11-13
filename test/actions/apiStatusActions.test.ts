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

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import {apiStatusActions, types} from '../../src/actions/apiStatusActions'
import {apiStatusInitialState} from '../../src/reducers/apiStatusReducer'

const mockStore = configureStore([thunk])
const mockAdapter = new MockAdapter(axios, { delayResponse: 1 })
let store

describe('apiStatusActions', () => {
  beforeEach(() => {
    store = mockStore({
      apiStatus: apiStatusInitialState,
    })
  })

  afterEach(() => {
    mockAdapter.restore()
    sessionStorage.clear()
  })

  it('fetch (success)', async () => {
    const mockResponse = {
      geoserver: 'a',
      'enabled-platforms': ['a', 'b'],
    }
    mockAdapter.onGet('/').reply(200, mockResponse)

    await store.dispatch(apiStatusActions.fetch())

    expect(store.getActions()).toEqual([
      { type: types.API_STATUS_FETCHING },
      {
        type: types.API_STATUS_FETCH_SUCCESS,
        geoserver: {
          wmsUrl: mockResponse.geoserver + '/wms',
        },
        enabledPlatforms: mockResponse['enabled-platforms'],
      },
    ])
  })

  it('fetch (request error)', async () => {
    mockAdapter.onGet('/').reply(400, 'error')

    await store.dispatch(apiStatusActions.fetch())

    expect(store.getActions()).toEqual([
      { type: types.API_STATUS_FETCHING },
      {
        type: types.API_STATUS_FETCH_ERROR,
        error: 'error',
      },
    ])
  })

  it('fetch (invalid response data)', async () => {
    mockAdapter.onGet('/').reply(200)

    await store.dispatch(apiStatusActions.fetch())

    const actions = store.getActions()
    expect(actions.length).toEqual(2)
    expect(actions[0]).toEqual({ type: types.API_STATUS_FETCHING })
    expect(actions[1].type).toEqual(types.API_STATUS_FETCH_ERROR)
    expect(actions[1].error).toBeDefined()
  })

  it('serialize', async () => {
    await store.dispatch(apiStatusActions.serialize())

    const state = store.getState()
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'geoserver',
      JSON.stringify(state.apiStatus.geoserver),
    )
    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'enabled_platforms_records',
      JSON.stringify(state.apiStatus.enabledPlatforms),
    )

    expect(store.getActions()).toEqual([
      { type: types.API_STATUS_SERIALIZED },
    ])
  })

  it('deserialize', async () => {
    // Mock local storage.
    const mockStorage = {
      geoserver: 'a',
      enabled_platforms_records: ['a', 'b'],
    }
    sessionStorage.setItem('geoserver', JSON.stringify(mockStorage.geoserver))
    sessionStorage.setItem('enabled_platforms_records', JSON.stringify(mockStorage.enabled_platforms_records))

    await store.dispatch(apiStatusActions.deserialize())

    expect(sessionStorage.getItem).toHaveBeenCalledWith('geoserver')
    expect(sessionStorage.getItem).toHaveBeenCalledWith('enabled_platforms_records')

    expect(store.getActions()).toEqual([
      {
        type: types.API_STATUS_DESERIALIZED,
        deserialized: {
          geoserver: mockStorage.geoserver,
          enabledPlatforms: mockStorage.enabled_platforms_records,
        },
      },
    ])
  })

  it('deserialize (defaults)', async () => {
    await store.dispatch(apiStatusActions.deserialize())

    expect(sessionStorage.getItem).toHaveBeenCalledWith('geoserver')
    expect(sessionStorage.getItem).toHaveBeenCalledWith('enabled_platforms_records')

    expect(store.getActions()).toEqual([
      {
        type: types.API_STATUS_DESERIALIZED,
        deserialized: {
          geoserver: apiStatusInitialState.geoserver,
          enabledPlatforms: apiStatusInitialState.enabledPlatforms,
        },
      },
    ])
  })

  it('deserialize (bad json)', async () => {
    // Mock local storage.
    sessionStorage.setItem('geoserver', 'badJson')
    sessionStorage.setItem('enabled_platforms_records', 'badJson')

    await store.dispatch(apiStatusActions.deserialize())

    // Deserialize should gracefully handle errors.
    expect(sessionStorage.getItem).toHaveBeenCalledWith('geoserver')
    expect(sessionStorage.getItem).toHaveBeenCalledWith('enabled_platforms_records')

    expect(store.getActions()).toEqual([
      {
        type: types.API_STATUS_DESERIALIZED,
        deserialized: {},
      },
    ])
  })
})
