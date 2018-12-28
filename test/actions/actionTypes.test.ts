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

import {AlgorithmsActions} from '../../src/actions/algorithmsActions'
import {ApiStatusActions} from '../../src/actions/apiStatusActions'
import {CatalogActions} from '../../src/actions/catalogActions'
import {JobsActions} from '../../src/actions/jobsActions'
import {MapActions} from '../../src/actions/mapActions'
import {ProductLinesActions} from '../../src/actions/productLinesActions'
import {RouteActions} from '../../src/actions/routeActions'
import {TourActions} from '../../src/actions/tourActions'
import {UserActions} from '../../src/actions/userActions'

const ActionsGroups = [
  AlgorithmsActions,
  ApiStatusActions,
  CatalogActions,
  JobsActions,
  MapActions,
  ProductLinesActions,
  RouteActions,
  TourActions,
  UserActions,
]

describe('action types', () => {
  test('no duplicate types', () => {
    const allTypes: string[] = []
    ActionsGroups.map(actionsGroup => {
      Object.keys(actionsGroup).forEach(key => {
        allTypes.push((actionsGroup as any)[key].type)
      })
    })
    allTypes.sort()

    allTypes.forEach((value: any, index: number) => {
      if ((index + 1) === allTypes.length) {
        return
      }

      expect(value).not.toEqual(allTypes[index + 1])
    })
  })

  test('static types match instance types', () => {
    ActionsGroups.map(actionsGroup => {
      Object.keys(actionsGroup).forEach(key => {
        const actionClass = (actionsGroup as any)[key]
        const action = new actionClass({})
        expect(actionClass.type).toEqual(action.type)
      })
    })
  })

  test('correct prefixes', () => {
    const expectedPrefixes = [
      { group: AlgorithmsActions, prefix: 'ALGORITHMS' },
      { group: ApiStatusActions, prefix: 'API_STATUS' },
      { group: CatalogActions, prefix: 'CATALOG' },
      { group: JobsActions, prefix: 'JOBS' },
      { group: MapActions, prefix: 'MAP' },
      { group: ProductLinesActions, prefix: 'PRODUCT_LINES' },
      { group: RouteActions, prefix: 'ROUTE' },
      { group: TourActions, prefix: 'TOUR' },
      { group: UserActions, prefix: 'USER' },
    ]

    expectedPrefixes.map(expected => {
      Object.keys(expected.group).forEach(key => {
        const actionClass = (expected.group as any)[key]
        expect(actionClass.type).toEqual(expect.stringMatching(new RegExp(`^${expected.prefix}_`)))
      })
    })
  })
})
