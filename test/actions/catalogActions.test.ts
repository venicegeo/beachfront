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
import * as sinon from 'sinon'
import * as session from '../../src/api/session'
import {catalogActions, types} from '../../src/actions/catalogActions'
import {catalogInitialState} from '../../src/reducers/catalogReducer'
import {IMAGERY_ENDPOINT, SCENE_TILE_PROVIDERS, USER_ENDPOINT} from '../../src/config'
import {getClient} from '../../src/api/session'

const mockStore = configureStore([thunk])
const mockAdapter = new MockAdapter(axios, { delayResponse: 1 })
let store

describe('catalogActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()

    store = mockStore({
      catalog: catalogInitialState,
    })
  })

  afterEach(() => {
    mockAdapter.restore()
  })

  describe('initialize()', () => {
    test('success', async () => {
      const getClientSpy = sinon.spy(session, 'getClient')

      mockAdapter.onGet(USER_ENDPOINT).reply(200)

      await store.dispatch(catalogActions.initialize())

      expect(getClientSpy.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: types.CATALOG_INITIALIZING },
        {
          type: types.CATALOG_INITIALIZE_SUCCESS,
          client: getClientSpy.returnValues[0],
        },
      ])

      getClientSpy.restore()
    })

    test('request error', async () => {
      const getClientSpy = sinon.spy(session, 'getClient')

      mockAdapter.onGet(USER_ENDPOINT).reply(400, 'error')

      await store.dispatch(catalogActions.initialize())

      expect(getClientSpy.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: types.CATALOG_INITIALIZING },
        {
          type: types.CATALOG_INITIALIZE_ERROR,
          error: 'error',
        },
      ])

      getClientSpy.restore()
    })

    test('non-request error', async () => {
      const getClientStub = sinon.stub(session, 'getClient').throwsException('error')

      mockAdapter.onGet(USER_ENDPOINT).reply(200)

      await store.dispatch(catalogActions.initialize())

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: types.CATALOG_INITIALIZING })
      expect(actions[1].type).toEqual(types.CATALOG_INITIALIZE_ERROR)
      expect(actions[1].error).toBeDefined()

      getClientStub.restore()
    })
  })

  describe('setApiKey()', () => {
    test('success', async () => {
      await store.dispatch(catalogActions.setApiKey('a'))

      expect(store.getActions()).toEqual([
        {
          type: types.CATALOG_API_KEY_UPDATED,
          apiKey: 'a',
        },
      ])
    })
  })

  describe('updateSearchCriteria()', () => {
    test('success', async () => {
      const searchCriteria = {
        cloudCover: 5,
        dateFrom: 'dateFrom',
        dateTo: 'dateTo',
        source: 'source',
      }

      await store.dispatch(catalogActions.updateSearchCriteria(searchCriteria))

      expect(store.getActions()).toEqual([
        {
          type: types.CATALOG_SEARCH_CRITERIA_UPDATED,
          searchCriteria,
        },
      ])
    })
  })

  describe('resetSearchCriteria()', () => {
    test('success', async () => {
      await store.dispatch(catalogActions.resetSearchCriteria())

      const actions = store.getActions()
      expect(actions).toEqual([
        { type: types.CATALOG_SEARCH_CRITERIA_RESET },
      ])
    })
  })

  describe('search()', () => {
    test('success', async () => {
      store = mockStore({
        catalog: {
          ...catalogInitialState,
          client: getClient(),
        },
        map: {
          bbox: [181, 0, 182, 1],
        },
      })

      const state = store.getState()

      const clientGetSpy = sinon.spy(state.catalog.client, 'get')

      const mockResponse = {
        features: [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
        ],
      }
      const searchUrl = getSearchUrl(state)
      mockAdapter.onGet(searchUrl).reply(200, mockResponse)

      await store.dispatch(catalogActions.search())

      expect(clientGetSpy.callCount).toEqual(1)
      expect(clientGetSpy.getCall(0).args).toEqual([
        searchUrl,
        {
          params: {
            cloudCover: state.catalog.searchCriteria.cloudCover + .05,
            PL_API_KEY: state.catalog.apiKey,
            bbox: '-179,0,-178,1',
            acquiredDate: new Date(state.catalog.searchCriteria.dateFrom).toISOString(),
            maxAcquiredDate: new Date(state.catalog.searchCriteria.dateTo).toISOString(),
          },
        },
      ])

      const actions = store.getActions()
      expect(actions).toEqual([
        { type: types.CATALOG_SEARCHING },
        {
          type: types.CATALOG_SEARCH_SUCCESS,
          searchResults: {
            images: {
              features: mockResponse.features.map(f => {
                return {
                  ...f,
                  id: state.catalog.searchCriteria.source + ':' + f.id,
                }
              }),
            },
            count: mockResponse.features.length,
            startIndex: 0,
            totalCount: mockResponse.features.length,
          },
        },
      ])

      clientGetSpy.restore()
    })

    test('tile provider error', async () => {
      store = mockStore({
        catalog: {
          ...catalogInitialState,
          searchCriteria: {
            ...catalogInitialState.searchCriteria,
            source: 'invalidSource',
          },
        },
        map: {
          bbox: [0, 1, 2, 3],
        },
      })

      await store.dispatch(catalogActions.search())

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: types.CATALOG_SEARCHING })
      expect(actions[1].type).toEqual(types.CATALOG_SEARCH_ERROR)
      expect(actions[1].error).toBeDefined()
    })

    test('request error', async () => {
      store = mockStore({
        catalog: {
          ...catalogInitialState,
          client: getClient(),
        },
        map: {
          bbox: [0, 1, 2, 3],
        },
      })

      const state = store.getState()
      mockAdapter.onGet(getSearchUrl(state)).reply(400, 'error')

      await store.dispatch(catalogActions.search())

      expect(store.getActions()).toEqual([
        { type: types.CATALOG_SEARCHING },
        {
          type: types.CATALOG_SEARCH_ERROR,
          error: 'error',
        },
      ])
    })

    test('invalid response data', async () => {
      store = mockStore({
        catalog: {
          ...catalogInitialState,
          client: getClient(),
        },
        map: {
          bbox: [0, 1, 2, 3],
        },
      })

      const state = store.getState()
      mockAdapter.onGet(getSearchUrl(state)).reply(200)

      await store.dispatch(catalogActions.search())

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: types.CATALOG_SEARCHING })
      expect(actions[1].type).toEqual(types.CATALOG_SEARCH_ERROR)
      expect(actions[1].error).toBeDefined()
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      store = mockStore({
        catalog: {
          ...catalogInitialState,
          searchResults: ['a', 'b', 'c'],
          apiKey: 'a',
        },
      })

      await store.dispatch(catalogActions.serialize())

      const state = store.getState()

      expect(sessionStorage.setItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('searchCriteria', JSON.stringify(state.catalog.searchCriteria))
      expect(sessionStorage.setItem).toHaveBeenCalledWith('searchResults', JSON.stringify(state.catalog.searchResults))

      expect(localStorage.setItem).toHaveBeenCalledTimes(1)
      expect(localStorage.setItem).toHaveBeenCalledWith('catalog_apiKey', state.catalog.apiKey)

      expect(store.getActions()).toEqual([
        { type: types.CATALOG_SERIALIZED },
      ])
    })
  })

  describe('deserialize()', () => {
    test('success', async () => {
      // Mock local storage.
      const mockStorage = {
        searchCriteria: {
          cloudCover: 5,
          dateFrom: 'dateFrom',
          dateTo: 'dateTo',
          source: 'source',
        },
        searchResults: ['a', 'b', 'c'],
        catalog_apiKey: 'apiKey',
      }
      sessionStorage.setItem('searchCriteria', JSON.stringify(mockStorage.searchCriteria))
      sessionStorage.setItem('searchResults', JSON.stringify(mockStorage.searchResults))
      localStorage.setItem('catalog_apiKey', mockStorage.catalog_apiKey)

      await store.dispatch(catalogActions.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: types.CATALOG_DESERIALIZED,
          deserialized: {
            searchCriteria: mockStorage.searchCriteria,
            searchResults: mockStorage.searchResults,
            apiKey: mockStorage.catalog_apiKey,
          },
        },
      ])
    })

    test('no saved data', async () => {
      await store.dispatch(catalogActions.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: types.CATALOG_DESERIALIZED,
          deserialized: {
            searchCriteria: catalogInitialState.searchCriteria,
            searchResults: null,
            apiKey: catalogInitialState.apiKey,
          },
        },
      ])
    })

    test('invalid saved data', async () => {
      sessionStorage.setItem('searchCriteria', 'badJson')
      sessionStorage.setItem('searchResults', 'badJson')

      await store.dispatch(catalogActions.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: types.CATALOG_DESERIALIZED,
          deserialized: {
            apiKey: catalogInitialState.apiKey,
          },
        },
      ])
    })
  })
})

function getSearchUrl(state) {
  const sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === state.catalog.searchCriteria.source)
  return `${IMAGERY_ENDPOINT}/${sceneTileProvider.catalogSection}/discover/${state.catalog.searchCriteria.source}`
}
