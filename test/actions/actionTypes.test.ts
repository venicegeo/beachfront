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

import {algorithmsTypes} from '../../src/actions/algorithmsActions'
import {apiStatusTypes} from '../../src/actions/apiStatusActions'
import {catalogTypes} from '../../src/actions/catalogActions'
import {jobsTypes} from '../../src/actions/jobsActions'
import {mapTypes} from '../../src/actions/mapActions'
import {productLinesTypes} from '../../src/actions/productLinesActions'
import {routeTypes} from '../../src/actions/routeActions'
import {tourTypes} from '../../src/actions/tourActions'
import {userTypes} from '../../src/actions/userActions'

describe('action types', () => {
  test('no duplicate types', () => {
    const allTypes: string[] = []
    Object.keys(algorithmsTypes).forEach(key => allTypes.push((<any>algorithmsTypes)[key]))
    Object.keys(apiStatusTypes).forEach(key => allTypes.push((<any>apiStatusTypes)[key]))
    Object.keys(catalogTypes).forEach(key => allTypes.push((<any>catalogTypes)[key]))
    Object.keys(jobsTypes).forEach(key => allTypes.push((<any>jobsTypes)[key]))
    Object.keys(mapTypes).forEach(key => allTypes.push((<any>mapTypes)[key]))
    Object.keys(productLinesTypes).forEach(key => allTypes.push((<any>productLinesTypes)[key]))
    Object.keys(routeTypes).forEach(key => allTypes.push((<any>routeTypes)[key]))
    Object.keys(tourTypes).forEach(key => allTypes.push((<any>tourTypes)[key]))
    Object.keys(userTypes).forEach(key => allTypes.push((<any>userTypes)[key]))
    allTypes.sort()

    allTypes.forEach((value: any, index: number) => {
      if ((index + 1) === allTypes.length) {
        return
      }

      expect(value).not.toEqual(allTypes[index + 1])
    })
  })

  test('keys match values', () => {
    Object.keys(algorithmsTypes).forEach(key => expect(key).toEqual((<any>algorithmsTypes)[key]))
    Object.keys(apiStatusTypes).forEach(key => expect(key).toEqual((<any>apiStatusTypes)[key]))
    Object.keys(catalogTypes).forEach(key => expect(key).toEqual((<any>catalogTypes)[key]))
    Object.keys(jobsTypes).forEach(key => expect(key).toEqual((<any>jobsTypes)[key]))
    Object.keys(mapTypes).forEach(key => expect(key).toEqual((<any>mapTypes)[key]))
    Object.keys(productLinesTypes).forEach(key => expect(key).toEqual((<any>productLinesTypes)[key]))
    Object.keys(routeTypes).forEach(key => expect(key).toEqual((<any>routeTypes)[key]))
    Object.keys(tourTypes).forEach(key => expect(key).toEqual((<any>tourTypes)[key]))
    Object.keys(userTypes).forEach(key => expect(key).toEqual((<any>userTypes)[key]))
  })

  test('correct prefixes', () => {
    Object.keys(algorithmsTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^ALGORITHMS_/)))
    Object.keys(apiStatusTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^API_STATUS_/)))
    Object.keys(catalogTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^CATALOG_/)))
    Object.keys(jobsTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^JOBS_/)))
    Object.keys(mapTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^MAP_/)))
    Object.keys(productLinesTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^PRODUCT_LINES_/)))
    Object.keys(routeTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^ROUTE_/)))
    Object.keys(tourTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^TOUR_/)))
    Object.keys(userTypes).forEach(key => expect(key).toEqual(expect.stringMatching(/^USER_/)))
  })
})
