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

import axios, {AxiosInstance} from 'axios'
import {API_ROOT} from '../config'

export const DEFAULT_TIMEOUT = 60000
const DEFAULT_ENTRY_URL = '/'

let _client: AxiosInstance,
  _onExpired: () => void

export function destroy(): void {
  _client = null
  _onExpired = null
  sessionStorage.clear()
}

export function initialize(): boolean {

  // User has already logged on
  const timestamp = sessionStorage.getItem('__timestamp__')
  if (timestamp) {
    return true
  }

  // User has been redirected back from bf-api
  if (location.search.indexOf('logged_in=true') !== -1) {
    sessionStorage.setItem('__timestamp__', new Date().toISOString())

    const entry = sessionStorage.getItem('__entry__') || DEFAULT_ENTRY_URL
    sessionStorage.removeItem('__entry__')

    // Return to original destination
    history.replaceState(null, null, entry)
    return true
  }

  // Save search for later
  sessionStorage.setItem('__entry__', location.pathname + location.search.replace(/\blogged_in=true&?/, ''))

  return false
}

export function getClient(): AxiosInstance {
  if (!_client) {
    _client = axios.create({
      baseURL: API_ROOT,
      timeout: DEFAULT_TIMEOUT,
      withCredentials: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': 'Basic Og==',
      },
      validateStatus(status) {
        if (status === 401 && _onExpired) {
          _onExpired()
          _onExpired = null
        }
        return status >= 200 && status < 300
      },
    })
  }
  return _client
}

export function onExpired(callback: () => void) {
  _onExpired = callback
}
