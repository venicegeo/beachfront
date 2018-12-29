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

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import thunk from 'redux-thunk'
import configureStore, {MockStoreEnhanced} from 'redux-mock-store'
import * as sinon from 'sinon'
import {SinonSpy} from 'sinon'
import {ProductLines, ProductLinesActions} from '../../src/actions/productLinesActions'
import {JOB_ENDPOINT, PRODUCTLINE_ENDPOINT} from '../../src/config'
import {getClient} from '../../src/api/session'
import {Extent} from '../../src/utils/geometries'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)
const clientSpies: {[key: string]: SinonSpy} = {
  get: sinon.spy(getClient(), 'get'),
  post: sinon.spy(getClient(), 'post'),
}

describe('productLinesActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store = mockStore(initialState) as any
  })

  afterEach(() => {
    mockAdapter.reset()
    Object.keys(clientSpies).forEach(name => clientSpies[name].resetHistory())
  })

  afterAll(() => {
    mockAdapter.restore()
    Object.keys(clientSpies).forEach(name => clientSpies[name].restore())
  })

  describe('fetch()', () => {
    test('success', async () => {
      const mockResponse = {
        productlines: {
          features: [1, 2, 3],
        },
      }
      mockAdapter.onGet(PRODUCTLINE_ENDPOINT).reply(200, mockResponse)

      await store.dispatch(ProductLines.fetch() as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([PRODUCTLINE_ENDPOINT])

      expect(store.getActions()).toEqual([
        { type: ProductLinesActions.Fetching.type },
        {
          type: ProductLinesActions.FetchSuccess.type,
          payload: {
            records: mockResponse.productlines.features,
          },
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onGet(PRODUCTLINE_ENDPOINT).reply(400)

      await store.dispatch(ProductLines.fetch() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: ProductLinesActions.Fetching.type })
      expect(actions[1].type).toEqual(ProductLinesActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      mockAdapter.onGet(PRODUCTLINE_ENDPOINT).reply(200)

      await store.dispatch(ProductLines.fetch() as any)

      const actions = store.getActions()
      expect(actions[0].type).toEqual(ProductLinesActions.Fetching.type)
      expect(actions[1].type).toEqual(ProductLinesActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('fetchJobs()', () => {
    function getJobsEndpoint(productLineId: string, sinceDate: string) {
      return `${JOB_ENDPOINT}/by_productline/${productLineId}?since=${sinceDate}`
    }

    test('success', async () => {
      const mockResponse = {
        jobs: {
          features: [1, 2, 3],
        },
      }
      const productLineId = '1'
      const sinceDate = '2'
      const url = getJobsEndpoint(productLineId, sinceDate)
      mockAdapter.onGet(url).reply(200, mockResponse)

      await store.dispatch(ProductLines.fetchJobs({ productLineId, sinceDate }) as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([url])

      expect(store.getActions()).toEqual([
        { type: ProductLinesActions.FetchingJobs.type },
        {
          type: ProductLinesActions.FetchJobsSuccess.type,
          payload: {
            jobs: mockResponse.jobs.features,
          },
        },
      ])
    })

    test('request error', async () => {
      const productLineId = '1'
      const sinceDate = '2'
      mockAdapter.onGet(getJobsEndpoint(productLineId, sinceDate)).reply(400,)

      await store.dispatch(ProductLines.fetchJobs({ productLineId, sinceDate }) as any)

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ProductLinesActions.FetchingJobs.type })
      expect(actions[1].type).toEqual(ProductLinesActions.FetchJobsError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      const productLineId = '1'
      const sinceDate = '2'
      mockAdapter.onGet(getJobsEndpoint(productLineId, sinceDate)).reply(200)

      await store.dispatch(ProductLines.fetchJobs({ productLineId, sinceDate }) as any)

      const actions = store.getActions()
      expect(actions[0].type).toEqual(ProductLinesActions.FetchingJobs.type)
      expect(actions[1].type).toEqual(ProductLinesActions.FetchJobsError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('create()', () => {
    test('success', async () => {
      const mockResponse = {
        productline: 1,
      }
      mockAdapter.onPost(PRODUCTLINE_ENDPOINT).reply(200, mockResponse)

      const args = {
        algorithmId: 'a',
        bbox: [1, 2, 3, 4] as Extent,
        category: 'b',
        dateStart: 'c',
        dateStop: 'd',
        maxCloudCover: 5,
        name: 'e',
      }
      await store.dispatch(ProductLines.create(args) as any)

      expect(clientSpies.post.callCount).toBe(1)
      expect(clientSpies.post.args[0]).toEqual([
        PRODUCTLINE_ENDPOINT,
        {
          algorithm_id: args.algorithmId,
          category: args.category,
          max_cloud_cover: args.maxCloudCover,
          min_x: args.bbox[0],
          min_y: args.bbox[1],
          max_x: args.bbox[2],
          max_y: args.bbox[3],
          name: args.name,
          spatial_filter_id: null,
          start_on: args.dateStart,
          stop_on: args.dateStop,
        },
      ])

      expect(store.getActions()).toEqual([
        { type: ProductLinesActions.CreatingProductLine.type },
        {
          type: ProductLinesActions.CreateProductLineSuccess.type,
          payload: {
            createdProductLine: mockResponse.productline,
          },
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onPost(PRODUCTLINE_ENDPOINT).reply(400)

      await store.dispatch(ProductLines.create({
        bbox: [1, 2, 3, 4],
      } as any) as any)

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: ProductLinesActions.CreatingProductLine.type })
      expect(actions[1].type).toEqual(ProductLinesActions.CreateProductLineError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      mockAdapter.onPost(PRODUCTLINE_ENDPOINT).reply(200)

      await store.dispatch(ProductLines.create({
        bbox: [1, 2, 3, 4],
      } as any) as any)

      const actions = store.getActions()
      expect(actions[0].type).toEqual(ProductLinesActions.CreatingProductLine.type)
      expect(actions[1].type).toEqual(ProductLinesActions.CreateProductLineError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

})
