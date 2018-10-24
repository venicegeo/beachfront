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

import {generateRoute} from '../utils/routeUtils'

export const types = {
  ROUTE_CHANGED: 'ROUTE_CHANGED',
}

export interface RouteLocation {
  pathname?: string
  search?: string
  hash?: string
  selectedFeature?: GeoJSON.Feature<any> | null
}

export interface RouteNavigateToArgs {
  loc: RouteLocation
  pushHistory?: boolean
}

export const routeActions = {
  navigateTo(args: RouteNavigateToArgs) {
    args = {
      ...args,
      pushHistory: (args.pushHistory != null) ? args.pushHistory : true,
    }

    const route = generateRoute(args.loc)

    if (args.pushHistory) {
      history.pushState(null, '', route.href)
    }

    return {
      type: types.ROUTE_CHANGED,
      route,
    }
  },
}
