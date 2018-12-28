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
import {Catalog, CatalogActions} from '../../src/actions/catalogActions'
import {catalogInitialState} from '../../src/reducers/catalogReducer'
import {IMAGERY_ENDPOINT, SCENE_TILE_PROVIDERS} from '../../src/config'
import {getClient} from '../../src/api/session'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)
let clientSpies: {[key: string]: SinonSpy} = {
  get: sinon.spy(getClient(), 'get'),
}

describe('catalogActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()

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

  describe('setApiKey()', () => {
    test('success', async () => {
      await store.dispatch(Catalog.setApiKey('a'))

      expect(store.getActions()).toEqual([
        {
          type: CatalogActions.ApiKeyUpdated.type,
          payload: {
            apiKey: 'a',
          },
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

      await store.dispatch(Catalog.updateSearchCriteria(searchCriteria))

      expect(store.getActions()).toEqual([
        {
          type: CatalogActions.SearchCriteriaUpdated.type,
          payload: {
            searchCriteria,
          },
        },
      ])
    })
  })

  describe('resetSearchCriteria()', () => {
    test('success', async () => {
      await store.dispatch(Catalog.resetSearchCriteria())

      const actions = store.getActions()
      expect(actions).toEqual([
        { type: CatalogActions.SearchCriteriaReset.type },
      ])
    })
  })

  describe('search()', () => {
    test('success', async () => {
      store = mockStore({
        ...initialState,
        map: {
          bbox: [181, 0, 182, 1],
        },
      }) as any

      const state = store.getState()

      const mockResponse = {
        features: [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
        ],
      }
      const searchUrl = getSearchUrl(state)
      mockAdapter.onGet(searchUrl).reply(200, mockResponse)

      await store.dispatch(Catalog.search() as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([
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
        { type: CatalogActions.Searching.type },
        {
          type: CatalogActions.SearchSuccess.type,
          payload: {
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
        },
      ])
    })

    test('tile provider error', async () => {
      store = mockStore({
        ...initialState,
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
      }) as any

      await store.dispatch(Catalog.search() as any)

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: CatalogActions.Searching.type })
      expect(actions[1].type).toEqual(CatalogActions.SearchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('request error', async () => {
      store = mockStore({
        ...initialState,
        catalog: {
          ...catalogInitialState,
          client: getClient(),
        },
        map: {
          bbox: [0, 1, 2, 3],
        },
      }) as any

      const state = store.getState()
      mockAdapter.onGet(getSearchUrl(state)).reply(400)

      await store.dispatch(Catalog.search() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: CatalogActions.Searching.type })
      expect(actions[1].type).toEqual(CatalogActions.SearchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      store = mockStore({
        ...initialState,
        catalog: {
          ...catalogInitialState,
          client: getClient(),
        },
        map: {
          bbox: [0, 1, 2, 3],
        },
      }) as any

      const state = store.getState()
      mockAdapter.onGet(getSearchUrl(state)).reply(200)

      await store.dispatch(Catalog.search() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: CatalogActions.Searching.type })
      expect(actions[1].type).toEqual(CatalogActions.SearchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('map bbox not set', async () => {
      await store.dispatch(Catalog.search() as any)
      const actions = store.getActions()
      expect(actions.length).toEqual(0)
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      store = mockStore({
        ...initialState,
        catalog: {
          ...catalogInitialState,
          searchResults: ['a', 'b', 'c'],
          apiKey: 'a',
        },
      }) as any

      await store.dispatch(Catalog.serialize() as any)

      const state = store.getState()

      expect(sessionStorage.setItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('searchCriteria', JSON.stringify(state.catalog.searchCriteria))
      expect(sessionStorage.setItem).toHaveBeenCalledWith('searchResults', JSON.stringify(state.catalog.searchResults))

      expect(localStorage.setItem).toHaveBeenCalledTimes(1)
      expect(localStorage.setItem).toHaveBeenCalledWith('catalog_apiKey', state.catalog.apiKey)

      expect(store.getActions()).toEqual([
        { type: CatalogActions.Serialized.type },
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

      await store.dispatch(Catalog.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: CatalogActions.Deserialized.type,
          payload: {
            searchCriteria: mockStorage.searchCriteria,
            searchResults: mockStorage.searchResults,
            apiKey: mockStorage.catalog_apiKey,
          },
        },
      ])
    })

    test('no saved data', async () => {
      await store.dispatch(Catalog.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: CatalogActions.Deserialized.type,
          payload: {
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

      await store.dispatch(Catalog.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchCriteria')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('searchResults')

      expect(localStorage.getItem).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem).toHaveBeenCalledWith('catalog_apiKey')

      expect(store.getActions()).toEqual([
        {
          type: CatalogActions.Deserialized.type,
          payload: {
            apiKey: catalogInitialState.apiKey,
            searchCriteria: catalogInitialState.searchCriteria,
            searchResults: catalogInitialState.searchResults,
          },
        },
      ])
    })
  })
})

function getSearchUrl(state: AppState) {
  const sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === state.catalog.searchCriteria.source)!
  return `${IMAGERY_ENDPOINT}/${sceneTileProvider.catalogSection}/discover/${state.catalog.searchCriteria.source}`
}
