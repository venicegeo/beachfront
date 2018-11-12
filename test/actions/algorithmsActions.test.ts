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

import {algorithmsActions, types} from '../../src/actions/algorithmsActions'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import {ALGORITHM_ENDPOINT} from '../../src/config'
import {algorithmsInitialState} from '../../src/reducers/algorithmsReducer'

const mockStore = configureStore([thunk])
const mock = new MockAdapter(axios, { delayResponse: 1 })
let store

describe('algorithmsActions', () => {
  beforeEach(() => {
    store = mockStore({
      algorithms: algorithmsInitialState,
    })
  })

  afterEach(() => {
    mock.restore()
    sessionStorage.clear()
  })

  it('fetch (success)', async () => {
    const mockResponse = {
      algorithms: [
        {
          description: 'a',
          service_id: 'a',
          max_cloud_cover: 1,
          name: 'a',
          interface: 'a',
        },
        {
          description: 'b',
          service_id: 'b',
          max_cloud_cover: 2,
          name: 'b',
          interface: 'b',
        },
      ],
    }
    mock.onGet(ALGORITHM_ENDPOINT).reply(200, mockResponse)

    await store.dispatch(algorithmsActions.fetch())

    const actions = store.getActions()
    expect(actions[0]).toEqual({ type: types.ALGORITHMS_FETCHING })
    expect(actions[1]).toEqual({
      type: types.ALGORITHMS_FETCH_SUCCESS,
      records: mockResponse.algorithms.map(record => ({
        description: record.description,
        id: record.service_id,
        maxCloudCover: record.max_cloud_cover,
        name: record.name,
        type: record.interface,
      })),
    })
  })

  it('fetch (error)', async () => {
    mock.onGet(ALGORITHM_ENDPOINT).reply(400, 'error')

    await store.dispatch(algorithmsActions.fetch())

    const actions = store.getActions()
    expect(actions[0]).toEqual({ type: types.ALGORITHMS_FETCHING })
    expect(actions[1]).toEqual({
      type: types.ALGORITHMS_FETCH_ERROR,
      error: 'error',
    })
  })

  it('serialize', async () => {
    await store.dispatch(algorithmsActions.serialize())

    expect(sessionStorage.setItem).toHaveBeenCalledWith(
      'algorithms_records',
      JSON.stringify(store.getState().algorithms.records),
    )

    const actions = store.getActions()
    expect(actions[0]).toEqual({ type: types.ALGORITHMS_SERIALIZED })
  })

  it('deserialize', async () => {
    // Mock local storage.
    const mockSavedRecords = []
    sessionStorage.setItem('algorithms_records', JSON.stringify(mockSavedRecords))

    await store.dispatch(algorithmsActions.deserialize())

    expect(sessionStorage.getItem).toHaveBeenCalledWith('algorithms_records')

    const actions = store.getActions()
    expect(actions[0]).toEqual({
      type: types.ALGORITHMS_DESERIALIZED,
      deserialized: {
        records: mockSavedRecords,
      },
    })
  })
})
