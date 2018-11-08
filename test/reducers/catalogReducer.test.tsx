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
import {types} from '../../src/actions/catalogActions'
import {types as mapTypes} from '../../src/actions/mapActions'
import * as moment from 'moment'

describe('catalogReducer', () => {
  it('initialState', () => {
    expect(catalogReducer(undefined, {})).toEqual(catalogInitialState)
  })

  it('CATALOG_DESERIALIZED', () => {
    const action = {
      type: types.CATALOG_DESERIALIZED,
      deserialized: {
        a: 'a',
      },
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      ...action.deserialized,
    })
  })

  it('CATALOG_INITIALIZING', () => {
    const action = { type: types.CATALOG_INITIALIZING }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      isInitializing: true,
    })
  })

  it('CATALOG_INITIALIZE_SUCCESS', () => {
    const state = {
      ...catalogInitialState,
      isInitializing: true,
    }

    const action = {
      type: types.CATALOG_INITIALIZE_SUCCESS,
      client: 'a',
    }

    expect(catalogReducer(state, action)).toEqual(({
      ...state,
      isInitializing: false,
      client: action.client,
    }))
  })

  it('CATALOG_INITIALIZE_ERROR', () => {
    const state = {
      ...catalogInitialState,
      isInitializing: true,
    }

    const action = {
      type: types.CATALOG_INITIALIZE_ERROR,
      error: 'a',
    }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isInitializing: false,
      initializeError: action.error,
    })
  })

  it('CATALOG_API_KEY_UPDATED', () => {
    const action = {
      type: types.CATALOG_API_KEY_UPDATED,
      apiKey: 'a',
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      apiKey: action.apiKey,
    })
  })

  it('CATALOG_SEARCH_CRITERIA_UPDATED', () => {
    const action = {
      type: types.CATALOG_SEARCH_CRITERIA_UPDATED,
      searchCriteria: {
        cloudCover: 1,
        dateFrom: moment(),
        dateTo: moment(),
        source: 'a',
      },
    }

    expect(catalogReducer(catalogInitialState, action)).toEqual({
      ...catalogInitialState,
      searchCriteria: {
        ...catalogInitialState.searchCriteria,
        ...action.searchCriteria,
      },
    })
  })

  it('CATALOG_SEARCH_CRITERIA_RESET', () => {
    const state = {
      ...catalogInitialState,
      searchCriteria: {
        cloudCover: 1,
        dateFrom: moment(),
        dateTo: moment(),
        source: 'a',
      },
    } as any

    const action = { type: types.CATALOG_SEARCH_CRITERIA_RESET }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      searchCriteria: catalogInitialState.searchCriteria,
    })
  })

  it('CATALOG_SEARCHING', () => {
    const state = {
      ...catalogInitialState,
      searchError: 'a',
    }

    const action = { type: types.CATALOG_SEARCHING }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: true,
      searchError: null,
    })
  })

  it('CATALOG_SEARCH_SUCCESS', () => {
    const state = {
      ...catalogInitialState,
      isSearching: true,
    }

    const action = {
      type: types.CATALOG_SEARCH_SUCCESS,
      searchResults: [1, 2, 3],
    }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: false,
      searchResults: action.searchResults,
    })
  })

  it('CATALOG_SEARCH_ERROR', () => {
    const state = {
      ...catalogInitialState,
      isSearching: true,
    }

    const action = {
      type: types.CATALOG_SEARCH_ERROR,
      error: 'a',
    }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      isSearching: false,
      searchError: action.error,
    })
  })

  it('MAP_BBOX_CLEARED', () => {
    const state = {
      ...catalogInitialState,
      searchResults: [1, 2, 3],
      searchError: 'a',
    } as any

    const action = { type: mapTypes.MAP_BBOX_CLEARED }

    expect(catalogReducer(state, action)).toEqual({
      ...state,
      searchResults: null,
      searchError: null,
    })
  })
})
