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

import {Action} from 'redux'
import {CatalogActions as Actions} from '../actions/catalogActions'
import {MapActions} from '../actions/mapActions'
import * as moment from 'moment'
import {SOURCE_DEFAULT} from '../constants'
import {RequestError} from '../utils/requestError'

const DATE_FORMAT = 'YYYY-MM-DD'

export interface CatalogState {
  readonly apiKey: string
  readonly isSearching: boolean
  readonly searchCriteria: {
    readonly cloudCover: number
    readonly dateFrom: string
    readonly dateTo: string
    readonly source: string
  },
  readonly searchError: RequestError | null
  readonly searchResults: beachfront.ImageryCatalogPage | null
}

export const catalogInitialState: CatalogState = {
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

export function catalogReducer(state = catalogInitialState, action: Action): CatalogState {
  switch (action.type) {
    case Actions.ApiKeyUpdated.type: {
      const payload = (action as Actions.ApiKeyUpdated).payload
      return {
        ...state,
        apiKey: payload.apiKey,
      }
    }
    case Actions.SearchCriteriaUpdated.type: {
      const payload = (action as Actions.SearchCriteriaUpdated).payload
      return {
        ...state,
        searchCriteria: {
          ...state.searchCriteria,
          ...payload.searchCriteria,
        },
      }
    }
    case Actions.SearchCriteriaReset.type:
      return {
        ...state,
        searchCriteria: catalogInitialState.searchCriteria,
      }
    case Actions.Searching.type:
      return {
        ...state,
        isSearching: true,
        searchError: null,
      }
    case Actions.SearchSuccess.type: {
      const payload = (action as Actions.SearchSuccess).payload
      return {
        ...state,
        isSearching: false,
        searchResults: payload.searchResults,
      }
    }
    case Actions.SearchError.type: {
      const payload = (action as Actions.SearchError).payload
      return {
        ...state,
        isSearching: false,
        searchError: payload.error,
      }
    }
    case Actions.Deserialized.type: {
      const payload = (action as Actions.Deserialized).payload
      return {
        ...state,
        searchCriteria: payload.searchCriteria,
        searchResults: payload.searchResults,
        apiKey: payload.apiKey,
      }
    }
    case MapActions.BboxCleared.type:
      return {
        ...state,
        searchResults: null,
        searchError: null,
      }
    default:
      return state
  }
}
