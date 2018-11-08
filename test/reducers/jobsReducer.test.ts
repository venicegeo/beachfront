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

import {jobsInitialState, jobsReducer} from '../../src/reducers/jobsReducer'
import {types} from '../../src/actions/jobsActions'

describe('jobsReducer', () => {
  it('initialState', () => {
    expect(jobsReducer(undefined, {})).toEqual(jobsInitialState)
  })

  it('JOBS_FETCHING', () => {
    const state = {
      ...jobsInitialState,
      fetchError: 'a',
    }

    const action = { type: types.JOBS_FETCHING }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  it('JOBS_FETCH_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isFetching: true,
    }

    const action = {
      type: types.JOBS_FETCH_SUCCESS,
      records: ['a', 'b', 'c'],
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      records: action.records,
    })
  })

  it('JOBS_FETCH_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isFetching: true,
    }

    const action = {
      type: types.JOBS_FETCH_ERROR,
      error: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.error,
    })
  })

  it('JOBS_FETCHING_ONE', () => {
    const state = {
      ...jobsInitialState,
      fetchOneError: 'a',
    }

    const action = { type: types.JOBS_FETCHING_ONE }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: true,
      fetchOneError: null,
    })
  })

  it('JOBS_FETCH_ONE_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isFetchingOne: true,
    }

    const action = {
      type: types.JOBS_FETCH_ONE_SUCCESS,
      record: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: false,
      records: [...state.records, action.record],
      lastOneFetched: action.record,
    })
  })

  it('JOBS_FETCH_ONE_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isFetchingOne: true,
    }

    const action = {
      type: types.JOBS_FETCH_ONE_ERROR,
      error: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isFetchingOne: false,
      fetchOneError: action.error,
    })
  })

  it('JOBS_CREATING_JOB', () => {
    const state = {
      ...jobsInitialState,
      createdJob: 'a',
      createJobError: 'a',
    }

    const action = { type: types.JOBS_CREATING_JOB }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isCreatingJob: true,
      createdJob: null,
      createJobError: null,
    })
  })

  it('JOBS_CREATE_JOB_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isCreatingJob: true,
      records: ['a'],
    }

    const action = {
      type: types.JOBS_CREATE_JOB_SUCCESS,
      createdJob: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isCreatingJob: false,
      createdJob: action.createdJob,
      records: [...state.records, action.createdJob],
    })
  })

  it('JOBS_CREATE_JOB_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isCreatingJob: true,
    }

    const action = {
      type: types.JOBS_CREATE_JOB_ERROR,
      error: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isCreatingJob: false,
      createJobError: action.error,
    })
  })

  it('JOBS_DISMISS_CREATE_JOB_ERROR', () => {
    const state = {
      ...jobsInitialState,
      createJobError: 'a',
    }

    const action = { type: types.JOBS_DISMISS_CREATE_JOB_ERROR }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      createJobError: null,
    })
  })

  it('JOBS_DELETING_JOB', () => {
    const state = {
      ...jobsInitialState,
      records: [
        { id: 'a' },
        { id: 'b' },
      ],
      deletedJobError: 'a',
    }

    const action = {
      type: types.JOBS_DELETING_JOB,
      deletedJob: { id: 'a' },
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isDeletingJob: true,
      deletedJob: action.deletedJob,
      deleteJobError: null,
      records: [{ id: 'b' }],
    })
  })

  it('JOBS_DELETE_JOB_SUCCESS', () => {
    const state = {
      ...jobsInitialState,
      isDeletingJob: true,
    }

    const action = { type: types.JOBS_DELETE_JOB_SUCCESS }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isDeletingJob: false,
    })
  })

  it('JOBS_DELETE_JOB_ERROR', () => {
    const state = {
      ...jobsInitialState,
      isDeletingJob: true,
      deletedJob: { id: 'a' },
      records: [{ id: 'b' }],
    }

    const action = {
      type: types.JOBS_DELETE_JOB_ERROR,
      error: 'a',
    }

    expect(jobsReducer(state, action)).toEqual({
      ...state,
      isDeletingJob: false,
      deleteJobError: action.error,
      records: [...state.records, state.deletedJob],
    })
  })
})
