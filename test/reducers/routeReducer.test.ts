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
import {types} from '../../src/actions/routeActions'

describe('routeReducer', () => {
  it('initialState', () => {
    expect(routeReducer(undefined, {})).toEqual(routeInitialState)
  })

  it('ROUTE_CHANGED', () => {
    const action = {
      type: types.ROUTE_CHANGED,
      hash: 'a',
      href: 'a',
      jobIds: ['a', 'b', 'c'],
      pathname: 'a',
      search: 'a',
      selectedFeature: 'a',
    }

    expect(routeReducer(routeInitialState, action)).toEqual({
      ...routeInitialState,
      hash: action.hash,
      href: action.href,
      jobIds: action.jobIds,
      pathname: action.pathname,
      search: action.search,
      selectedFeature: action.selectedFeature,
    })
  })
})
