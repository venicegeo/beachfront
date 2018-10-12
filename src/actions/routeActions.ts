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

import {RouteState} from '../reducers/routeReducer'

export const types = {
  ROUTE_CHANGED: 'ROUTE_CHANGED',
}

export const routeActions = {
  navigateTo(loc, pushHistory = true) {
    const route = generateRoute(loc)

    if (pushHistory) {
      history.pushState(null, null, route.href)
    }

    return {
      type: types.ROUTE_CHANGED,
      route,
    }
  },
}

export function generateRoute({ pathname = '/', search = '', hash = '', selectedFeature = null }): RouteState {
  return {
    pathname,
    search,
    hash,
    selectedFeature,

    // Helpers
    href: pathname + search + hash,
    jobIds: search.substr(1).split('&').filter(s => s.startsWith('jobId')).map(s => s.replace('jobId=', '')),
  }
}
