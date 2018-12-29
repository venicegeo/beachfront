/*
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
 */

import {routeInitialState, routeReducer} from '../../src/reducers/routeReducer'
import {RouteActions} from '../../src/actions/routeActions'

describe('routeReducer', () => {
  test('initialState', () => {
    expect(routeReducer(undefined, { type: null })).toEqual(routeInitialState)
  })

  test('ROUTE_CHANGED', () => {
    const action = {
      type: RouteActions.Changed.type,
      payload: {
        hash: 'a',
        href: 'b',
        jobIds: 'c',
        pathname: 'd',
        search: 'e',
        selectedFeature: 'f',
      },
    }

    expect(routeReducer(routeInitialState, action)).toEqual({
      ...routeInitialState,
      hash: action.payload.hash,
      href: action.payload.href,
      jobIds: action.payload.jobIds,
      pathname: action.payload.pathname,
      search: action.payload.search,
      selectedFeature: action.payload.selectedFeature,
    })
  })
})
