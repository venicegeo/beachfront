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
import {RouteActions as Actions} from '../actions/routeActions'
import {generateRoute} from '../utils/routeUtils'

export interface RouteState {
  readonly hash: string
  readonly href: string
  readonly jobIds: string[]
  readonly pathname: string
  readonly search: string
  readonly selectedFeature: GeoJSON.Feature<any> | null
}

export const routeInitialState: RouteState = generateRoute(location)

export function routeReducer(state = routeInitialState, action: Action): RouteState {
  switch (action.type) {
    case Actions.Changed.type: {
      const payload = (action as Actions.Changed).payload
      return {
        ...state,
        hash: payload.hash,
        href: payload.href,
        jobIds: payload.jobIds,
        pathname: payload.pathname,
        search: payload.search,
        selectedFeature: payload.selectedFeature,
      }
    }
    default:
      return state
  }
}
