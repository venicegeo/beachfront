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

export const types = {
  CATALOG_API_KEY_CHANGED: 'USER_CATALOG_API_KEY_CHANGED',
  CATALOG_SERIALIZED: 'CATALOG_SERIALIZED',
}

export const catalogActions = {
  setApiKey(apiKey: string) {
    return {
      type: types.CATALOG_API_KEY_CHANGED,
      apiKey,
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const catalog = getState().catalog
      localStorage.setItem('catalog_apiKey', catalog.apiKey)  // HACK
      dispatch({ type: types.CATALOG_SERIALIZED })
    }
  },
}
