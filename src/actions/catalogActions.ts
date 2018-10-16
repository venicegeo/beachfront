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

import {AppState} from '../store'

export const types = {
  CATALOG_API_KEY_UPDATED: 'CATALOG_API_KEY_UPDATED',
  CATALOG_SERIALIZED: 'CATALOG_SERIALIZED',
  CATALOG_DESERIALIZED: 'CATALOG_DESERIALIZED',
}

export const catalogActions = {
  setApiKey(apiKey: string) {
    return {
      type: types.CATALOG_API_KEY_UPDATED,
      apiKey,
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      localStorage.setItem('catalog_apiKey', state.catalog.apiKey)  // HACK

      dispatch({ type: types.CATALOG_SERIALIZED })
    }
  },

  deserialize() {
    return {
      type: types.CATALOG_DESERIALIZED,
      state: {
        apiKey: localStorage.getItem('catalog_apiKey'),
      },
    }
  },
}
