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

import {Dispatch} from 'redux'
import {AppState} from '../store'
import {IMAGERY_ENDPOINT, SCENE_TILE_PROVIDERS} from '../config'
import {getClient} from '../api/session'
import {wrap} from '../utils/math'
import {catalogInitialState, CatalogState} from '../reducers/catalogReducer'

export const catalogTypes = {
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

type SearchResponse = {
  data: {
    features: Array<{
      id: string
    }>
  }
}

export const catalogActions = {
  setApiKey(apiKey: string) {
    return {
      type: catalogTypes.CATALOG_API_KEY_UPDATED,
      apiKey,
    }
  },

  updateSearchCriteria(searchCriteria: CatalogUpdateSearchCriteriaArgs) {
    return {
      type: catalogTypes.CATALOG_SEARCH_CRITERIA_UPDATED,
      searchCriteria,
    }
  },

  resetSearchCriteria() {
    return { type: catalogTypes.CATALOG_SEARCH_CRITERIA_RESET }
  },

  search(args: CatalogSearchArgs = {startIndex: 0, count: 100}) {
    return async (dispatch: Dispatch<CatalogState>, getState: () => AppState) => {
      const state = getState()

      if (!state.map.bbox) {
        console.error('Unable to perform search: bbox is null!')
        return
      }

      dispatch({ type: catalogTypes.CATALOG_SEARCHING })

      console.warn('(catalog:search): Discarding parameters `count` (%s) and `startIndex` (%s)', args.count, args.startIndex)

      // Wrap bbox X coordinates to stay within the -180/180 range. Some data sources won't return results otherwise.
      const bboxWidth = state.map.bbox[2] - state.map.bbox[0]
      const wrappedBbox = [...state.map.bbox]
      wrappedBbox[0] = wrap(wrappedBbox[0], -180, 180)
      wrappedBbox[2] = wrappedBbox[0] + bboxWidth

      let sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === state.catalog.searchCriteria.source)
      if (!sceneTileProvider) {
        dispatch({
          type: catalogTypes.CATALOG_SEARCH_ERROR,
          error: new Error(`Unknown data source prefix: '${state.catalog.searchCriteria.source}'`),
        })
        return
      }

      try {
        const response = await getClient().get(`${IMAGERY_ENDPOINT}/${sceneTileProvider.catalogSection}/discover/${state.catalog.searchCriteria.source}`, {
          params: {
            cloudCover: state.catalog.searchCriteria.cloudCover + .05,
            PL_API_KEY: state.catalog.apiKey,
            bbox: wrappedBbox.join(','),
            acquiredDate: new Date(state.catalog.searchCriteria.dateFrom).toISOString(),
            maxAcquiredDate: new Date(state.catalog.searchCriteria.dateTo).toISOString(),
          },
        }) as SearchResponse

        // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
        console.warn('(catalog:search) Normalizing bf-ia-broker response')

        response.data.features.forEach(f => {
          f.id = state.catalog.searchCriteria.source + ':' + f.id
        })

        dispatch({
          type: catalogTypes.CATALOG_SEARCH_SUCCESS,
          searchResults: {
            images: response.data,
            count: response.data.features.length,
            startIndex: 0,
            totalCount: response.data.features.length,
          },
        })
      } catch (error) {
        dispatch({
          type: catalogTypes.CATALOG_SEARCH_ERROR,
          error,
        })
      }
    }
  },

  serialize() {
    return (dispatch: Dispatch<CatalogState>, getState: () => AppState) => {
      const state = getState()

      sessionStorage.setItem('searchCriteria', JSON.stringify(state.catalog.searchCriteria))
      sessionStorage.setItem('searchResults', JSON.stringify(state.catalog.searchResults))
      localStorage.setItem('catalog_apiKey', state.catalog.apiKey)  // HACK

      dispatch({ type: catalogTypes.CATALOG_SERIALIZED })
    }
  },

  deserialize() {
    const deserialized: any = {}

    try {
      deserialized.searchCriteria = JSON.parse(sessionStorage.getItem('searchCriteria') || 'null') || catalogInitialState.searchCriteria
    } catch (error) {
      console.warn('Failed to deserialize "searchCriteria"')
    }

    try {
      deserialized.searchResults = JSON.parse(sessionStorage.getItem('searchResults') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "searchResults"')
    }

    deserialized.apiKey = localStorage.getItem('catalog_apiKey') || catalogInitialState.apiKey

    return {
      type: catalogTypes.CATALOG_DESERIALIZED,
      deserialized,
    }
  },
}
