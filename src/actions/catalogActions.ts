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

import {Action, Dispatch} from 'redux'
import {GeoJSON} from 'geojson'
import {AppState} from '../store'
import {IMAGERY_ENDPOINT, SCENE_TILE_PROVIDERS} from '../config'
import {getClient} from '../api/session'
import {wrap} from '../utils/math'
import {catalogInitialState, CatalogState} from '../reducers/catalogReducer'

export namespace Catalog {
  export function setApiKey(apiKey: string) {
    return {...new CatalogActions.ApiKeyUpdated({ apiKey })}
  }

  export function updateSearchCriteria(searchCriteria: CatalogUpdateSearchCriteriaArgs) {
    return {...new CatalogActions.SearchCriteriaUpdated({ searchCriteria })}
  }

  export function resetSearchCriteria() {
    return {...new CatalogActions.SearchCriteriaReset()}
  }

  export function search(args: CatalogSearchArgs = { startIndex: 0, count: 100 }) {
    return async (dispatch: Dispatch<CatalogState>, getState: () => AppState) => {
      const state = getState()

      if (!state.map.bbox) {
        console.error('Unable to perform search: bbox is null!')
        return
      }

      dispatch({...new CatalogActions.Searching()})

      console.warn('(catalog:search): Discarding parameters `count` (%s) and `startIndex` (%s)', args.count, args.startIndex)

      // Wrap bbox X coordinates to stay within the -180/180 range. Some data sources won't return results otherwise.
      const bboxWidth = state.map.bbox[2] - state.map.bbox[0]
      const wrappedBbox = [...state.map.bbox]
      wrappedBbox[0] = wrap(wrappedBbox[0], -180, 180)
      wrappedBbox[2] = wrappedBbox[0] + bboxWidth

      let sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === state.catalog.searchCriteria.source)
      if (!sceneTileProvider) {
        dispatch({...new CatalogActions.SearchError({
          error: new Error(`Unknown data source prefix: '${state.catalog.searchCriteria.source}'`),
        })})
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

        dispatch({...new CatalogActions.SearchSuccess({
          searchResults: {
            images: response.data,
            count: response.data.features.length,
            startIndex: 0,
            totalCount: response.data.features.length,
          },
        })})
      } catch (error) {
        dispatch({...new CatalogActions.SearchError({ error })})
      }
    }
  }

  export function serialize() {
    return (dispatch: Dispatch<CatalogState>, getState: () => AppState) => {
      const state = getState()

      sessionStorage.setItem('searchCriteria', JSON.stringify(state.catalog.searchCriteria))
      sessionStorage.setItem('searchResults', JSON.stringify(state.catalog.searchResults))
      localStorage.setItem('catalog_apiKey', state.catalog.apiKey)  // HACK

      dispatch({...new CatalogActions.Serialized()})
    }
  }

  export function deserialize() {
    let searchCriteria: typeof catalogInitialState.searchCriteria | null = null
    try {
      searchCriteria = JSON.parse(sessionStorage.getItem('searchCriteria') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "searchCriteria"')
    }

    let searchResults: typeof catalogInitialState.searchResults | null = null
    try {
      searchResults = JSON.parse(sessionStorage.getItem('searchResults') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "searchResults"')
    }

    const apiKey: string | null = localStorage.getItem('catalog_apiKey')

    return {...new CatalogActions.Deserialized({
      searchCriteria: searchCriteria || catalogInitialState.searchCriteria,
      searchResults,
      apiKey: apiKey || catalogInitialState.apiKey,
    })}
  }
}

export namespace CatalogActions {
  export class ApiKeyUpdated implements Action {
    static type = 'CATALOG_API_KEY_UPDATED'
    type = ApiKeyUpdated.type
    constructor(public payload: {
      apiKey: CatalogState['apiKey']
    }) {}
  }

  export class SearchCriteriaUpdated implements Action {
    static type = 'CATALOG_SEARCH_CRITERIA_UPDATED'
    type = SearchCriteriaUpdated.type
    constructor(public payload: {
      searchCriteria: CatalogUpdateSearchCriteriaArgs
    }) {}
  }

  export class SearchCriteriaReset implements Action {
    static type = 'CATALOG_SEARCH_CRITERIA_RESET'
    type = SearchCriteriaReset.type
  }

  export class Searching implements Action {
    static type = 'CATALOG_SEARCHING'
    type = Searching.type
  }

  export class SearchSuccess implements Action {
    static type = 'CATALOG_SEARCH_SUCCESS'
    type = SearchSuccess.type
    constructor(public payload: {
      searchResults: NonNullable<CatalogState['searchResults']>
    }) {}
  }

  export class SearchError implements Action {
    static type = 'CATALOG_SEARCH_ERROR'
    type = SearchError.type
    constructor(public payload: {
      error: CatalogState['searchError']
    }) {}
  }

  export class Serialized implements Action {
    static type = 'CATALOG_SERIALIZED'
    type = Serialized.type
  }

  export class Deserialized implements Action {
    static type = 'CATALOG_DESERIALIZED'
    type = Deserialized.type
    constructor(public payload: {
      searchCriteria: CatalogState['searchCriteria']
      searchResults: CatalogState['searchResults']
      apiKey: CatalogState['apiKey']
    }) {}
  }
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

interface SearchResponse {
  data: GeoJSON.FeatureCollection<any>
}
