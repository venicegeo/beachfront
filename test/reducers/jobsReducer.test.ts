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

import {jobsInitialState, jobsReducer, JobsState} from '../../src/reducers/jobsReducer'
import {JobsActions} from '../../src/actions/jobsActions'

describe('jobsReducer', () => {
  test('initialState', () => {
    expect(jobsReducer(undefined, { type: null })).toEqual(jobsInitialState)
  })

  test('JOBS_FETCHING', () => {
    const state: JobsState = {
      ...jobsInitialState,
      fetchError: 'a',
    }

    const action = { type: JobsActions.Fetching.type }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  test('JOBS_FETCH_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isFetching: true,
    }

    const action = {
      type: JobsActions.FetchSuccess.type,
      payload: {
        records: 'a',
      },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      records: action.payload.records,
      initialFetchComplete: true,
    })
  })

  test('JOBS_FETCH_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isFetching: true,
    }

    const action = {
      type: JobsActions.FetchError.type,
      payload: {
        error: 'a',
      },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.payload.error,
    })
  })

  test('JOBS_FETCHING_ONE', () => {
    const state = {
      ...jobsInitialState,
      fetchOneError: 'a',
    }

    const action = { type: JobsActions.FetchingOne.type }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: true,
      fetchOneError: null,
    })
  })

  test('JOBS_FETCH_ONE_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isFetchingOne: true,
    }

    const action = {
      type: JobsActions.FetchOneSuccess.type,
      payload: {
        record: 'a',
      },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: false,
      records: [...state.records, action.payload.record],
      lastOneFetched: action.payload.record,
    })
  })

  test('JOBS_FETCH_ONE_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isFetchingOne: true,
    }

    const action = {
      type: JobsActions.FetchOneError.type,
      payload: {
        error: 'a',
      },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: false,
      fetchOneError: action.payload.error,
    })
  })

  test('JOBS_CREATING_JOB', () => {
    const state = {
      ...jobsInitialState,
      createdJob: 'a',
      createJobError: 'b',
    }

    const action = { type: JobsActions.CreatingJob.type }

    expect(jobsReducer(state as any, action)).toEqual({
      ...state,
      isCreatingJob: true,
      createdJob: null,
      createJobError: null,
    })
  })

  test('JOBS_CREATE_JOB_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isCreatingJob: true,
      records: ['a'],
    }

    const action = {
      type: JobsActions.CreateJobSuccess.type,
      payload: {
        createdJob: 'a',
      },
    }

    expect(jobsReducer(state as any, action)).toEqual({
      ...state,
      isCreatingJob: false,
      createdJob: action.payload.createdJob,
      records: [...state.records, action.payload.createdJob],
    })
  })

  test('JOBS_CREATE_JOB_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isCreatingJob: true,
    }

    const action = {
      type: JobsActions.CreateJobError.type,
      payload: {
        error: 'a',
      },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isCreatingJob: false,
      createJobError: action.payload.error,
    })
  })

  test('JOBS_CREATE_JOB_ERROR_DISMISSED', () => {
    const state = {
      ...jobsInitialState,
      createJobError: 'a',
    }

    const action = { type: JobsActions.CreateJobErrorDismissed.type }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      createJobError: null,
    })
  })

  test('JOBS_DELETING_JOB', () => {
    const state = {
      ...jobsInitialState,
      records: [{ id: 'a' }, { id: 'b' }],
      deletedJobError: 'c',
    }

    const action = {
      type: JobsActions.DeletingJob.type,
      payload: {
        deletedJob: { id: 'a' },
      },
    }

    expect(jobsReducer(state as any, action)).toEqual({
      ...state,
      isDeletingJob: true,
      deletedJob: action.payload.deletedJob,
      deleteJobError: null,
      records: [{ id: 'b' }],
    })
  })

  test('JOBS_DELETE_JOB_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isDeletingJob: true,
    }

    const action = { type: JobsActions.DeleteJobSuccess.type }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isDeletingJob: false,
    })
  })

  test('JOBS_DELETE_JOB_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isDeletingJob: true,
      deletedJob: 'a',
      records: ['b'],
    }

    const action = {
      type: JobsActions.DeleteJobError.type,
      payload: {
        error: 'a',
      },
    }

    expect(jobsReducer(state as any, action)).toEqual({
      ...state,
      isDeletingJob: false,
      deleteJobError: action.payload.error,
      records: [...state.records, state.deletedJob],
    })
  })
})
