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
import configureStore, {MockStoreEnhanced} from 'redux-mock-store'
import * as sinon from 'sinon'
import {SinonSpy} from 'sinon'
import {ALGORITHM_ENDPOINT} from '../../src/config'
import {Algorithms, AlgorithmsActions} from '../../src/actions/algorithmsActions'
import {algorithmsInitialState} from '../../src/reducers/algorithmsReducer'
import {getClient} from '../../src/api/session'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)
let clientSpies: {[key: string]: SinonSpy} = {
  get: sinon.spy(getClient(), 'get'),
}

describe('algorithmsActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    store = mockStore(initialState) as any
  })

  afterEach(() => {
    mockAdapter.reset()
    Object.keys(clientSpies).forEach(name => clientSpies[name].resetHistory())
  })

  afterAll(() => {
    mockAdapter.restore()
    Object.keys(clientSpies).forEach(name => clientSpies[name].restore())
  })

  describe('fetch()', () => {
    test('success', async () => {
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
      mockAdapter.onGet(ALGORITHM_ENDPOINT).reply(200, mockResponse)

      await store.dispatch(Algorithms.fetch() as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([ALGORITHM_ENDPOINT])

      expect(store.getActions()).toEqual([
        { type: AlgorithmsActions.Fetching.type },
        {
          type: AlgorithmsActions.FetchSuccess.type,
          payload: {
            records: mockResponse.algorithms.map(record => ({
              description: record.description,
              id: record.service_id,
              maxCloudCover: record.max_cloud_cover,
              name: record.name,
              type: record.interface,
            })),
          },
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onGet(ALGORITHM_ENDPOINT).reply(400)

      await store.dispatch(Algorithms.fetch() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: AlgorithmsActions.Fetching.type })
      expect(actions[1].type).toEqual(AlgorithmsActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('non-request error', async () => {
      mockAdapter.onGet(ALGORITHM_ENDPOINT).reply(200)

      await store.dispatch(Algorithms.fetch() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: AlgorithmsActions.Fetching.type })
      expect(actions[1].type).toEqual(AlgorithmsActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      await store.dispatch(Algorithms.serialize() as any)

      expect(sessionStorage.setItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'algorithms_records',
        JSON.stringify(store.getState().algorithms.records),
      )

      expect(store.getActions()).toEqual([
        { type: AlgorithmsActions.Serialized.type },
      ])
    })
  })

  describe('deserialize()', () => {
    test('success', async () => {
      // Mock local storage.
      const mockSavedRecords: any[] = []
      sessionStorage.setItem('algorithms_records', JSON.stringify(mockSavedRecords))

      await store.dispatch(Algorithms.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('algorithms_records')

      expect(store.getActions()).toEqual([
        {
          type: AlgorithmsActions.Deserialized.type,
          payload: {
            records: mockSavedRecords,
          },
        },
      ])
    })

    test('no saved data', async () => {
      await store.dispatch(Algorithms.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('algorithms_records')

      expect(store.getActions()).toEqual([
        {
          type: AlgorithmsActions.Deserialized.type,
          payload: {
            records: algorithmsInitialState.records,
          },
        },
      ])
    })

    test('invalid saved data', async () => {
      // Mock local storage.
      sessionStorage.setItem('algorithms_records', 'badJson')

      await store.dispatch(Algorithms.deserialize())

      // Deserialize should gracefully handle errors.
      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('algorithms_records')

      expect(store.getActions()).toEqual([
        {
          type: AlgorithmsActions.Deserialized.type,
          payload: {
            records: algorithmsInitialState.records,
          },
        },
      ])
    })
  })
})
