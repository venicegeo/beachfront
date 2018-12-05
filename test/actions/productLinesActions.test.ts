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
import configureStore from 'redux-mock-store'
import * as sinon from 'sinon'
import {productLinesActions, productLinesTypes} from '../../src/actions/productLinesActions'
import {productLinesInitialState} from '../../src/reducers/productLinesReducer'
import {JOB_ENDPOINT, PRODUCTLINE_ENDPOINT} from '../../src/config'
import {getClient} from '../../src/api/session'
import {Extent} from '../../src/utils/geometries'

const mockStore = configureStore([thunk])
let store

const mockAdapter = new MockAdapter(axios)
const clientSpies = {
  get: sinon.spy(getClient(), 'get'),
  post: sinon.spy(getClient(), 'post'),
}

describe('productLinesActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    store = mockStore({
      productLines: productLinesInitialState,
    })
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

      await store.dispatch(productLinesActions.fetch())

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([PRODUCTLINE_ENDPOINT])

      expect(store.getActions()).toEqual([
        { type: productLinesTypes.PRODUCT_LINES_FETCHING },
        {
          type: productLinesTypes.PRODUCT_LINES_FETCH_SUCCESS,
          records: mockResponse.productlines.features,
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onGet(PRODUCTLINE_ENDPOINT).reply(400)

      await store.dispatch(productLinesActions.fetch())

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: productLinesTypes.PRODUCT_LINES_FETCHING })
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCH_ERROR)
      expect(actions[1].error).toBeDefined()
    })

    test('invalid response data', async () => {
      mockAdapter.onGet(PRODUCTLINE_ENDPOINT).reply(200)

      await store.dispatch(productLinesActions.fetch())

      const actions = store.getActions()
      expect(actions[0].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCHING)
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCH_ERROR)
      expect(actions[1].error).toBeDefined()
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

      await store.dispatch(productLinesActions.fetchJobs({ productLineId, sinceDate }))

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([url])

      expect(store.getActions()).toEqual([
        { type: productLinesTypes.PRODUCT_LINES_FETCHING_JOBS },
        {
          type: productLinesTypes.PRODUCT_LINES_FETCH_JOBS_SUCCESS,
          jobs: mockResponse.jobs.features,
        },
      ])
    })

    test('request error', async () => {
      const productLineId = '1'
      const sinceDate = '2'
      mockAdapter.onGet(getJobsEndpoint(productLineId, sinceDate)).reply(400,)

      await store.dispatch(productLinesActions.fetchJobs({ productLineId, sinceDate }))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: productLinesTypes.PRODUCT_LINES_FETCHING_JOBS })
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCH_JOBS_ERROR)
      expect(actions[1].error).toBeDefined()
    })

    test('invalid response data', async () => {
      const productLineId = '1'
      const sinceDate = '2'
      mockAdapter.onGet(getJobsEndpoint(productLineId, sinceDate)).reply(200)

      await store.dispatch(productLinesActions.fetchJobs({ productLineId, sinceDate }))

      const actions = store.getActions()
      expect(actions[0].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCHING_JOBS)
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_FETCH_JOBS_ERROR)
      expect(actions[1].error).toBeDefined()
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
      await store.dispatch(productLinesActions.create(args))

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
        { type: productLinesTypes.PRODUCT_LINES_CREATING_PRODUCT_LINE },
        {
          type: productLinesTypes.PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS,
          createdProductLine: mockResponse.productline,
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onPost(PRODUCTLINE_ENDPOINT).reply(400)

      await store.dispatch(productLinesActions.create({
        bbox: [1, 2, 3, 4],
      } as any))

      const actions = store.getActions()
      expect(actions[0]).toEqual({ type: productLinesTypes.PRODUCT_LINES_CREATING_PRODUCT_LINE })
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR)
      expect(actions[1].error).toBeDefined()
    })

    test('invalid response data', async () => {
      mockAdapter.onPost(PRODUCTLINE_ENDPOINT).reply(200)

      await store.dispatch(productLinesActions.create({
        bbox: [1, 2, 3, 4],
      } as any))

      const actions = store.getActions()
      expect(actions[0].type).toEqual(productLinesTypes.PRODUCT_LINES_CREATING_PRODUCT_LINE)
      expect(actions[1].type).toEqual(productLinesTypes.PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR)
      expect(actions[1].error).toBeDefined()
    })
  })

})
