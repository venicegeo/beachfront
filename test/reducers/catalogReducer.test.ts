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

import {catalogInitialState, catalogReducer} from '../../src/reducers/catalogReducer'
import {CatalogActions} from '../../src/actions/catalogActions'
import {MapActions} from '../../src/actions/mapActions'

describe('catalogReducer', () => {
  test('initialState', () => {
    expect(catalogReducer(undefined, { type: null })).toEqual(catalogInitialState)
  })

  test('CATALOG_API_KEY_UPDATED', () => {
    const action = {
      type: CatalogActions.ApiKeyUpdated.type,
      payload: {
        apiKey: 'a',
      },
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      apiKey: action.payload.apiKey,
    })
  })

  test('CATALOG_SEARCH_CRITERIA_UPDATED', () => {
    const action = {
      type: CatalogActions.SearchCriteriaUpdated.type,
      payload: {
        searchCriteria: {
          cloudCover: 'a',
          dateFrom: 'b',
          dateTo: 'c',
          source: 'd',
        },
      },
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      searchCriteria: {
        ...catalogInitialState.searchCriteria,
        ...action.payload.searchCriteria,
      },
    })
  })

  test('CATALOG_SEARCH_CRITERIA_RESET', () => {
    const state = {
      ...catalogInitialState,
      searchCriteria: {
        cloudCover: 'a',
        dateFrom: 'b',
        dateTo: 'c',
        source: 'd',
      },
    } as any

    const action = { type: CatalogActions.SearchCriteriaReset.type }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      searchCriteria: catalogInitialState.searchCriteria,
    })
  })

  test('CATALOG_SEARCHING', () => {
    const state = {
      ...catalogInitialState,
      searchError: 'a',
    }

    const action = { type: CatalogActions.Searching.type }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: true,
      searchError: null,
    })
  })

  test('CATALOG_SEARCH_SUCCESS', () => {
    const state = {
      ...catalogInitialState,
      isSearching: true,
    }

    const action = {
      type: CatalogActions.SearchSuccess.type,
      payload: {
        searchResults: 'a',
      },
    }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: false,
      searchResults: action.payload.searchResults,
    })
  })

  test('CATALOG_SEARCH_ERROR', () => {
    const state = {
      ...catalogInitialState,
      isSearching: true,
    }

    const action = {
      type: CatalogActions.SearchError.type,
      payload: {
        error: 'a',
      },
    }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: false,
      searchError: action.payload.error,
    })
  })

  test('CATALOG_DESERIALIZED', () => {
    const action = {
      type: CatalogActions.Deserialized.type,
      payload: {
        searchCriteria: 'a',
        searchResults: 'b',
        apiKey: 'c',
      },
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      searchCriteria: action.payload.searchCriteria,
      searchResults: action.payload.searchResults,
      apiKey: action.payload.apiKey,
    })
  })

  test('MAP_BBOX_CLEARED', () => {
    const state = {
      ...catalogInitialState,
      searchResults: 'a',
      searchError: 'b',
    } as any

    const action = { type: MapActions.BboxCleared.type }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      searchResults: null,
      searchError: null,
    })
  })
})
