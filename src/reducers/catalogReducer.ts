/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
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

import {types} from '../actions/catalogActions'
import {types as mapTypes} from '../actions/mapActions'
import {AxiosInstance} from 'axios'
import * as moment from 'moment'
import {SOURCE_DEFAULT} from '../constants'

const DATE_FORMAT = 'YYYY-MM-DD'

export interface CatalogState {
  client: AxiosInstance | null
  isInitializing: boolean
  initializeError: any
  apiKey: string
  isSearching: boolean
  searchCriteria: {
    cloudCover: number
    dateFrom: string
    dateTo: string
    source: string
  },
  searchError: any
  searchResults: beachfront.ImageryCatalogPage | null
}

export const catalogInitialState: CatalogState = {
  client: null,
  isInitializing: false,
  initializeError: null,
  apiKey: '',
  isSearching: false,
  searchCriteria: {
    cloudCover: 10,
    dateFrom: moment().subtract(30, 'days').format(DATE_FORMAT),
    dateTo: moment().format(DATE_FORMAT),
    source: SOURCE_DEFAULT,
  },
  searchError: null,
  searchResults: null,
}

export function catalogReducer(state = catalogInitialState, action: any): CatalogState {
  switch (action.type) {
    case types.CATALOG_DESERIALIZED:
      return {
        ...state,
        ...action.deserialized,
      }
    case types.CATALOG_INITIALIZING:
      return {
        ...state,
        isInitializing: true,
      }
    case types.CATALOG_INITIALIZE_SUCCESS:
      return {
        ...state,
        isInitializing: false,
        client: action.client,
      }
    case types.CATALOG_INITIALIZE_ERROR:
      return {
        ...state,
        isInitializing: false,
        initializeError: action.error,
      }
    case types.CATALOG_API_KEY_UPDATED:
      return {
        ...state,
        apiKey: action.apiKey,
      }
    case types.CATALOG_SEARCH_CRITERIA_UPDATED:
      return {
        ...state,
        searchCriteria: {
          ...state.searchCriteria,
          ...action.searchCriteria,
        },
      }
    case types.CATALOG_SEARCH_CRITERIA_RESET:
      return {
        ...state,
        searchCriteria: catalogInitialState.searchCriteria,
      }
    case types.CATALOG_SEARCHING:
      return {
        ...state,
        isSearching: true,
        searchError: null,
      }
    case types.CATALOG_SEARCH_SUCCESS:
      return {
        ...state,
        isSearching: false,
        searchResults: action.searchResults,
      }
    case types.CATALOG_SEARCH_ERROR:
      return {
        ...state,
        isSearching: false,
        searchError: action.error,
      }
    case mapTypes.MAP_BBOX_CLEARED:
      return {
        ...state,
        searchResults: null,
        searchError: null,
      }
    default:
      return state
  }
}
