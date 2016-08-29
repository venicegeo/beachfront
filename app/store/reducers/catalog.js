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

import {
  DISCOVER_CATALOG,
  DISCOVER_CATALOG_SUCCESS,
  DISCOVER_CATALOG_ERROR,
  UPDATE_CATALOG_API_KEY,
} from '../../actions/catalog'

const INITIAL_STATE = {
  apiKey:      null,
  discovering: false,
  eventTypeId: null,
  filters:     [],
  url:         null,
  error:       null,
}

export function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
  case DISCOVER_CATALOG:
    return {
      ...state,
      discovering: true
    }
  case DISCOVER_CATALOG_SUCCESS:
    return {
      ...state,
      discovering: false,
      eventTypeId: action.eventTypeId,
      filters: action.filters,
      url: action.url
    }
  case DISCOVER_CATALOG_ERROR:
    return {
      ...state,
      discovering: false,
      error: action.err
    }
  case UPDATE_CATALOG_API_KEY:
    return {
      ...state,
      apiKey: action.apiKey
    }
  default:
    return state
  }
}

export function deserialize() {
  return {
    ...INITIAL_STATE,
    apiKey:  localStorage.getItem('catalog_apiKey') || INITIAL_STATE.apiKey,
    url:     sessionStorage.getItem('catalog_url') || INITIAL_STATE.url,
    filters: JSON.parse(sessionStorage.getItem('catalog_filters')) || INITIAL_STATE.filters,
  }
}

export function serialize(state) {
  localStorage.setItem('catalog_apiKey', state.apiKey || '')
  sessionStorage.setItem('catalog_filters', JSON.stringify(state.filters))
  sessionStorage.setItem('catalog_url', state.url || '')
}