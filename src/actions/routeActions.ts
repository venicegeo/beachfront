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
import {generateRoute} from '../utils/routeUtils'
import {RouteState} from '../reducers/routeReducer'

export namespace Route {
  export function navigateTo(args: RouteNavigateToArgs) {
    args = {
      ...args,
      pushHistory: (args.pushHistory != null) ? args.pushHistory : true,
    }

    const route = generateRoute(args.loc)

    if (args.pushHistory) {
      history.pushState(null, '', route.href)
    }

    return {...new RouteActions.Changed({
      hash: route.hash,
      href: route.href,
      jobIds: route.jobIds,
      pathname: route.pathname,
      search: route.search,
      selectedFeature: route.selectedFeature,
    })}
  }
}

export namespace RouteActions {
  export class Changed implements Action {
    static type = 'ROUTE_CHANGED'
    type = Changed.type
    constructor(public payload: {
      hash: RouteState['hash']
      href: RouteState['href']
      jobIds: RouteState['jobIds']
      pathname: RouteState['pathname']
      search: RouteState['search']
      selectedFeature: RouteState['selectedFeature']
    }) {}
  }
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
