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

import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import * as sinon from 'sinon'
import {routeActions, routeTypes} from '../../src/actions/routeActions'
import {routeInitialState} from '../../src/reducers/routeReducer'

const mockStore = configureStore([thunk])
let store

describe('routeActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    store = mockStore({
      route: routeInitialState,
    })
  })

  describe('navigateTo()', () => {
    test('success', async () => {
      const loc = {
        pathname: 'a',
        search: '?jobId=1&jobId=2&jobId=3',
        hash: 'b',
        selectedFeature: 'c',
      }

      const pushStateSpy = sinon.spy(history, 'pushState')

      await store.dispatch(routeActions.navigateTo({ loc } as any))

      const href = `${loc.pathname}${loc.search}${loc.hash}`

      expect(pushStateSpy.callCount).toEqual(1)
      expect(pushStateSpy.args[0]).toEqual([null, '', href])

      expect(store.getActions()).toEqual([
        {
          type: routeTypes.ROUTE_CHANGED,
          pathname: loc.pathname,
          search: loc.search,
          hash: loc.hash,
          selectedFeature: loc.selectedFeature,
          href,
          jobIds: ['1', '2', '3'],
        },
      ])

      pushStateSpy.restore()
    })

    test('defaults', async () => {
      await store.dispatch(routeActions.navigateTo({ loc: {} }))

      expect(store.getActions()).toEqual([
        {
          type: routeTypes.ROUTE_CHANGED,
          pathname: '/',
          search: '',
          hash: '',
          selectedFeature: null,
          href: '/',
          jobIds: [],
        },
      ])
    })

    test('pushHistory: false', async () => {
      const pushStateSpy = sinon.spy(history, 'pushState')

      await store.dispatch(routeActions.navigateTo(({
        loc: {},
        pushHistory: false,
      })))

      expect(pushStateSpy.callCount).toEqual(0)

      pushStateSpy.restore()
    })
  })
})
