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
import {Jobs, JobsActions} from '../../src/actions/jobsActions'
import {JOB_ENDPOINT} from '../../src/config'
import {getClient} from '../../src/api/session'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)
const clientSpies: {[key: string]: SinonSpy} = {
  get: sinon.spy(getClient(), 'get'),
  post: sinon.spy(getClient(), 'post'),
  delete: sinon.spy(getClient(), 'delete'),
}

describe('jobsActions', () => {
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
      const mockResponseData = {
        jobs: {
          features: ['a', 'b', 'c'],
        },
      }
      mockAdapter.onGet(JOB_ENDPOINT).reply(200, mockResponseData)

      await store.dispatch(Jobs.fetch() as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([JOB_ENDPOINT])

      expect(store.getActions()).toEqual([
        { type: JobsActions.Fetching.type },
        {
          type: JobsActions.FetchSuccess.type,
          payload: {
            records: mockResponseData.jobs.features,
          },
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onGet(JOB_ENDPOINT).reply(400)

      await store.dispatch(Jobs.fetch() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.Fetching.type })
      expect(actions[1].type).toEqual(JobsActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      mockAdapter.onGet(JOB_ENDPOINT).reply(200)

      await store.dispatch(Jobs.fetch() as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.Fetching.type })
      expect(actions[1].type).toEqual(JobsActions.FetchError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('fetchOne()', () => {
    test('success', async () => {
      const mockJobId = 'a'
      const mockResponseData = {
        job: { id: mockJobId },
      }
      const url = `${JOB_ENDPOINT}/${mockJobId}`
      mockAdapter.onGet(url).reply(200, mockResponseData)

      await store.dispatch(Jobs.fetchOne(mockJobId) as any)

      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual([url])

      expect(store.getActions()).toEqual([
        { type: JobsActions.FetchingOne.type },
        {
          type: JobsActions.FetchOneSuccess.type,
          payload: {
            record: mockResponseData.job,
          },
        },
      ])
    })

    test('request error', async () => {
      const mockJobId = 'a'
      mockAdapter.onGet(`${JOB_ENDPOINT}/${mockJobId}`).reply(400)

      await store.dispatch(Jobs.fetchOne(mockJobId) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.FetchingOne.type })
      expect(actions[1].type).toEqual(JobsActions.FetchOneError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      const mockJob = { id: 'a' }
      mockAdapter.onGet(`${JOB_ENDPOINT}/${mockJob.id}`).reply(200)

      await store.dispatch(Jobs.fetchOne(mockJob.id) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.FetchingOne.type })
      expect(actions[1].type).toEqual(JobsActions.FetchOneError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('createJob()', () => {
    test('success', async () => {
      const mockResponseData = {
        job: { id: 'a' },
      }
      mockAdapter.onPost(JOB_ENDPOINT).reply(200, mockResponseData)

      const args = {
        algorithmId: 'algorithmId',
        computeMask: true,
        name: 'name',
        catalogApiKey: 'catalogApiKey',
        sceneId: 'sceneId',
      }
      await store.dispatch(Jobs.createJob(args) as any)

      expect(clientSpies.post.callCount).toEqual(1)
      expect(clientSpies.post.args[0]).toEqual([
        JOB_ENDPOINT,
        {
          algorithm_id: args.algorithmId,
          compute_mask: args.computeMask,
          name: args.name,
          planet_api_key: args.catalogApiKey,
          scene_id: args.sceneId,
        },
      ])

      expect(store.getActions()).toEqual([
        { type: JobsActions.CreatingJob.type },
        {
          type: JobsActions.CreateJobSuccess.type,
          payload: {
            createdJob: mockResponseData.job,
          },
        },
      ])
    })

    test('request error', async () => {
      mockAdapter.onPost(JOB_ENDPOINT).reply(400)

      await store.dispatch(Jobs.createJob({
        algorithmId: 'algorithmId',
        computeMask: true,
        name: 'name',
        catalogApiKey: 'catalogApiKey',
        sceneId: 'sceneId',
      }) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.CreatingJob.type })
      expect(actions[1].type).toEqual(JobsActions.CreateJobError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('invalid response data', async () => {
      mockAdapter.onPost(JOB_ENDPOINT).reply(200)

      await store.dispatch(Jobs.createJob({
        algorithmId: 'algorithmId',
        computeMask: true,
        name: 'name',
        catalogApiKey: 'catalogApiKey',
        sceneId: 'sceneId',
      }) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: JobsActions.CreatingJob.type })
      expect(actions[1].type).toEqual(JobsActions.CreateJobError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })

  describe('dismissCreateJobError()', () => {
    test('success', async () => {
      await store.dispatch(Jobs.dismissCreateJobError())

      expect(store.getActions()).toEqual([
        { type: JobsActions.CreateJobErrorDismissed.type },
      ])
    })
  })

  describe('deleteJob()', () => {
    test('success', async () => {
      const mockJob = { id: 'a' }
      const url = `${JOB_ENDPOINT}/${mockJob.id}`
      mockAdapter.onDelete(url).reply(200)

      await store.dispatch(Jobs.deleteJob(mockJob as any) as any)

      expect(clientSpies.delete.callCount).toEqual(1)
      expect(clientSpies.delete.args[0]).toEqual([url])

      expect(store.getActions()).toEqual([
        {
          type: JobsActions.DeletingJob.type,
          payload: {
            deletedJob: mockJob,
          },
        },
        { type: JobsActions.DeleteJobSuccess.type },
      ])
    })

    test('request error', async () => {
      const mockJob = { id: 'a' }
      mockAdapter.onDelete(`${JOB_ENDPOINT}/${mockJob.id}`).reply(400)

      await store.dispatch(Jobs.deleteJob(mockJob as any) as any)

      const actions = store.getActions()
      expect(actions[0]).toEqual({
        type: JobsActions.DeletingJob.type,
        payload: {
          deletedJob: mockJob,
        },
      })
      expect(actions[1].type).toEqual(JobsActions.DeleteJobError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('non-request error', async () => {
      await store.dispatch(Jobs.deleteJob(null as any) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({
        type: JobsActions.DeletingJob.type,
        payload: {
          deletedJob: null,
        },
      })
      expect(actions[1].type).toEqual(JobsActions.DeleteJobError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })
  })
})
