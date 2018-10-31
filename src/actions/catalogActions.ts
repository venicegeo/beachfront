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

import {AppState} from '../store'
import {API_ROOT, IMAGERY_ENDPOINT, SCENE_TILE_PROVIDERS, USER_ENDPOINT} from '../config'
import axios from 'axios'
import {DEFAULT_TIMEOUT, getClient} from '../api/session'
import {wrap} from '../utils/math'
import {catalogInitialState} from '../reducers/catalogReducer'

export const types = {
  CATALOG_INITIALIZING: 'CATALOG_INITIALIZING',
  CATALOG_INITIALIZE_SUCCESS: 'CATALOG_INITIALIZE_SUCCESS',
  CATALOG_INITIALIZE_ERROR: 'CATALOG_INITIALIZE_ERROR',
  CATALOG_API_KEY_UPDATED: 'CATALOG_API_KEY_UPDATED',
  CATALOG_SEARCH_CRITERIA_UPDATED: 'CATALOG_SEARCH_CRITERIA_UPDATED',
  CATALOG_SEARCH_CRITERIA_RESET: 'CATALOG_SEARCH_CRITERIA_RESET',
  CATALOG_SEARCHING: 'CATALOG_SEARCHING',
  CATALOG_SEARCH_SUCCESS: 'CATALOG_SEARCH_SUCCESS',
  CATALOG_SEARCH_ERROR: 'CATALOG_SEARCH_ERROR',
  CATALOG_SERIALIZED: 'CATALOG_SERIALIZED',
  CATALOG_DESERIALIZED: 'CATALOG_DESERIALIZED',
}

export interface CatalogSearchArgs {
  startIndex: number
  count: number
}

export interface CatalogUpdateSearchCriteriaArgs {
  cloudCover?: number
  dateFrom?: string
  dateTo?: string
  source?: string
}

export const catalogActions = {
  initialize() {
    return async dispatch => {
      dispatch({ type: types.CATALOG_INITIALIZING })

      try {
        await getClient().get(USER_ENDPOINT)
        const client = axios.create({
          baseURL: API_ROOT,
          timeout: DEFAULT_TIMEOUT,
          withCredentials: true,
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Authorization': 'Basic Og==',
          },
        })
        dispatch({
          type: types.CATALOG_INITIALIZE_SUCCESS,
          client,
        })
      } catch (error) {
        dispatch({
          type: types.CATALOG_INITIALIZE_ERROR,
          error,
        })
      }
    }
  },

  setApiKey(apiKey: string) {
    return {
      type: types.CATALOG_API_KEY_UPDATED,
      apiKey,
    }
  },

  updateSearchCriteria(searchCriteria: CatalogUpdateSearchCriteriaArgs) {
    return {
      type: types.CATALOG_SEARCH_CRITERIA_UPDATED,
      searchCriteria,
    }
  },

  resetSearchCriteria() {
    return { type: types.CATALOG_SEARCH_CRITERIA_RESET }
  },

  search(args: CatalogSearchArgs = {startIndex: 0, count: 100}) {
    return async (dispatch, getState) => {
      dispatch({ type: types.CATALOG_SEARCHING })

      console.warn('(catalog:search): Discarding parameters `count` (%s) and `startIndex` (%s)', args.count, args.startIndex)

      const state: AppState = getState()

      // Wrap bbox X coordinates to stay within the -180/180 range. Some data sources won't return results otherwise.
      const bboxWidth = state.map.bbox[2] - state.map.bbox[0]
      const wrappedBbox = [...state.map.bbox]
      wrappedBbox[0] = wrap(wrappedBbox[0], -180, 180)
      wrappedBbox[2] = wrappedBbox[0] + bboxWidth

      let sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === state.catalog.searchCriteria.source)
      if (!sceneTileProvider) {
        dispatch({
          type: types.CATALOG_SEARCH_ERROR,
          error: new Error(`Unknown data source prefix: '${state.catalog.searchCriteria.source}'`),
        })
        return
      }

      try {
        const response = await state.catalog.client.get(`${IMAGERY_ENDPOINT}/${sceneTileProvider.catalogSection}/discover/${state.catalog.searchCriteria.source}`, {
          params: {
            cloudCover: state.catalog.searchCriteria.cloudCover + .05,
            PL_API_KEY: state.catalog.apiKey,
            bbox: wrappedBbox.join(','),
            acquiredDate: new Date(state.catalog.searchCriteria.dateFrom).toISOString(),
            maxAcquiredDate: new Date(state.catalog.searchCriteria.dateTo).toISOString(),
          },
        })

        // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
        console.warn('(catalog:search) Normalizing bf-ia-broker response')

        const images = response.data
        images.features.forEach(f => {
          f.id = state.catalog.searchCriteria.source + ':' + f.id
        })

        dispatch({
          type: types.CATALOG_SEARCH_SUCCESS,
          searchResults: {
            images,
            count: images.features.length,
            startIndex: 0,
            totalCount: images.features.length,
          },
        })
      } catch (error) {
        dispatch({
          type: types.CATALOG_SEARCH_ERROR,
          error,
        })
      }
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      sessionStorage.setItem('searchCriteria', JSON.stringify(state.catalog.searchCriteria))
      sessionStorage.setItem('searchResults', JSON.stringify(state.catalog.searchResults))
      localStorage.setItem('catalog_apiKey', state.catalog.apiKey)  // HACK

      dispatch({ type: types.CATALOG_SERIALIZED })
    }
  },

  deserialize() {
    const deserialized: any = {}

    try {
      deserialized.searchCriteria = JSON.parse(sessionStorage.getItem('searchCriteria')) || catalogInitialState.searchCriteria
    } catch (error) {
      console.warn('Failed to deserialize "searchCriteria"')
    }

    try {
      deserialized.searchResults = JSON.parse(sessionStorage.getItem('searchResults'))
    } catch (error) {
      console.warn('Failed to deserialize "searchResults"')
    }

    try {
      deserialized.apiKey = localStorage.getItem('catalog_apiKey') || catalogInitialState.apiKey
    } catch (error) {
      console.warn('Failed to deserialize "catalog_apiKey"')
    }

    return {
      type: types.CATALOG_DESERIALIZED,
      deserialized,
    }
  },
}
