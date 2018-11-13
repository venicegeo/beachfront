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
import {jobsActions, types} from '../../src/actions/jobsActions'
import {jobsInitialState} from '../../src/reducers/jobsReducer'
import {JOB_ENDPOINT} from '../../src/config'

const mockStore = configureStore([thunk])
const mockAdapter = new MockAdapter(axios, { delayResponse: 1 })
let store

describe('catalogActions', () => {
  beforeEach(() => {
    store = mockStore({
      jobs: jobsInitialState,
    })
  })

  afterEach(() => {
    mockAdapter.restore()
    sessionStorage.clear()
    localStorage.clear()
  })

  it('fetch (success)', async () => {
    const mockResponseData = {
      jobs: {
        features: ['a', 'b', 'c'],
      },
    }
    mockAdapter.onGet(JOB_ENDPOINT).reply(200, mockResponseData)

    await store.dispatch(jobsActions.fetch())

    expect(store.getActions()).toEqual([
      { type: types.JOBS_FETCHING },
      {
        type: types.JOBS_FETCH_SUCCESS,
        records: mockResponseData.jobs.features,
      },
    ])
  })

  it('fetch (request error)', async () => {
    mockAdapter.onGet(JOB_ENDPOINT).reply(400, 'error')

    await store.dispatch(jobsActions.fetch())

    expect(store.getActions()).toEqual([
      { type: types.JOBS_FETCHING },
      {
        type: types.JOBS_FETCH_ERROR,
        error: 'error',
      },
    ])
  })

  it('fetch (invalid response data)', async () => {
    mockAdapter.onGet(JOB_ENDPOINT).reply(200)

    await store.dispatch(jobsActions.fetch())

    const actions = store.getActions()
    expect(actions.length).toEqual(2)
    expect(actions[0]).toEqual({ type: types.JOBS_FETCHING })
    expect(actions[1].type).toEqual(types.JOBS_FETCH_ERROR)
    expect(actions[1].error).toBeDefined()
  })

  it('fetchOne (success)', async () => {
    const mockJobId = 'a'
    const mockResponseData = {
      job: { id: mockJobId },
    }
    mockAdapter.onGet(`${JOB_ENDPOINT}/${mockJobId}`).reply(200, mockResponseData)

    await store.dispatch(jobsActions.fetchOne(mockJobId))

    expect(store.getActions()).toEqual([
      { type: types.JOBS_FETCHING_ONE },
      {
        type: types.JOBS_FETCH_ONE_SUCCESS,
        record: mockResponseData.job,
      },
    ])
  })

  it('fetchOne (request error)', async () => {
    const mockJobId = 'a'
    mockAdapter.onGet(`${JOB_ENDPOINT}/${mockJobId}`).reply(400, 'error')

    await store.dispatch(jobsActions.fetchOne(mockJobId))

    expect(store.getActions()).toEqual([
      { type: types.JOBS_FETCHING_ONE },
      {
        type: types.JOBS_FETCH_ONE_ERROR,
        error: 'error',
      },
    ])
  })

  it('fetchOne (invalid response data)', async () => {
    const mockJob = { id: 'a' }
    mockAdapter.onGet(`${JOB_ENDPOINT}/${mockJob.id}`).reply(200)

    await store.dispatch(jobsActions.fetchOne(mockJob.id))

    const actions = store.getActions()
    expect(actions.length).toEqual(2)
    expect(actions[0]).toEqual({ type: types.JOBS_FETCHING_ONE })
    expect(actions[1].type).toEqual(types.JOBS_FETCH_ONE_ERROR)
    expect(actions[1].error).toBeDefined()
  })

  it('createJob (success)', async () => {
    const mockResponseData = {
      job: { id: 'a' },
    }
    mockAdapter.onPost(JOB_ENDPOINT).reply(200, mockResponseData)

    await store.dispatch(jobsActions.createJob({
      algorithmId: 'algorithmId',
      computeMask: true,
      name: 'name',
      catalogApiKey: 'catalogApiKey',
      sceneId: 'sceneId',
    }))

    expect(store.getActions()).toEqual([
      { type: types.JOBS_CREATING_JOB },
      {
        type: types.JOBS_CREATE_JOB_SUCCESS,
        createdJob: mockResponseData.job,
      },
    ])
  })

  it('createJob (request error)', async () => {
    mockAdapter.onPost(JOB_ENDPOINT).reply(400, 'error')

    await store.dispatch(jobsActions.createJob({
      algorithmId: 'algorithmId',
      computeMask: true,
      name: 'name',
      catalogApiKey: 'catalogApiKey',
      sceneId: 'sceneId',
    }))

    expect(store.getActions()).toEqual([
      { type: types.JOBS_CREATING_JOB },
      {
        type: types.JOBS_CREATE_JOB_ERROR,
        error: 'error',
      },
    ])
  })

  it('createJob (invalid response data)', async () => {
    mockAdapter.onPost(JOB_ENDPOINT).reply(200)

    await store.dispatch(jobsActions.createJob({
      algorithmId: 'algorithmId',
      computeMask: true,
      name: 'name',
      catalogApiKey: 'catalogApiKey',
      sceneId: 'sceneId',
    }))

    const actions = store.getActions()
    expect(actions.length).toEqual(2)
    expect(actions[0]).toEqual({ type: types.JOBS_CREATING_JOB })
    expect(actions[1].type).toEqual(types.JOBS_CREATE_JOB_ERROR)
    expect(actions[1].error).toBeDefined()
  })

  it('dismissCreateJobError', async () => {
    await store.dispatch(jobsActions.dismissCreateJobError())

    expect(store.getActions()).toEqual([
      { type: types.JOBS_CREATE_JOB_ERROR_DISMISSED },
    ])
  })

  it('deleteJob (success)', async () => {
    const mockJob = { id: 'a' }
    mockAdapter.onDelete(`${JOB_ENDPOINT}/${mockJob.id}`).reply(200)

    await store.dispatch(jobsActions.deleteJob(mockJob as any))

    expect(store.getActions()).toEqual([
      {
        type: types.JOBS_DELETING_JOB,
        deletedJob: mockJob,
      },
      { type: types.JOBS_DELETE_JOB_SUCCESS },
    ])
  })

  it('deleteJob (request error)', async () => {
    const mockJob = { id: 'a' }
    mockAdapter.onDelete(`${JOB_ENDPOINT}/${mockJob.id}`).reply(400, 'error')

    await store.dispatch(jobsActions.deleteJob(mockJob as any))

    expect(store.getActions()).toEqual([
      {
        type: types.JOBS_DELETING_JOB,
        deletedJob: mockJob,
      },
      {
        type: types.JOBS_DELETE_JOB_ERROR,
        error: 'error',
      },
    ])
  })

  it('deleteJob (invalid job)', async () => {
    await store.dispatch(jobsActions.deleteJob(null))

    const actions = store.getActions()
    expect(actions[0]).toEqual({
        type: types.JOBS_DELETING_JOB,
        deletedJob: null,
    })
    expect(actions[1].type).toEqual(types.JOBS_DELETE_JOB_ERROR)
    expect(actions[1].error).toBeDefined()
  })
})
