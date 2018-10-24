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
import {RouteLocation} from '../actions/routeActions'

export function generateRoute(args: RouteLocation): RouteState {
  args.pathname = args.pathname || '/'
  args.search = args.search || ''
  args.hash = args.hash || ''
  args.selectedFeature = args.selectedFeature || null

  return {
    pathname: args.pathname,
    search: args.search,
    hash: args.hash,
    selectedFeature: args.selectedFeature,

    // Helpers
    href: args.pathname + args.search + args.hash,
    jobIds: args.search.substr(1).split('&').filter(s => s.startsWith('jobId')).map(s => s.replace('jobId=', '')),
  }
}
