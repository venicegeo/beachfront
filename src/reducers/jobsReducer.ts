/**
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
 **/

import {types} from '../actions/jobsActions'

export type JobsState = {
  records: beachfront.Job[]
  isFetching: boolean
  fetchError: any
  isFetchingOne: boolean
  fetchOneError: any
  lastOneFetched: beachfront.Job | null
  isDeletingJob: boolean
  deletedJob: beachfront.Job | null
  deleteJobError: any
  isCreatingJob: boolean
  createdJob: beachfront.Job | null
  createJobError: any
}

export const jobsInitialState = {
  records: [],
  isFetching: false,
  fetchError: null,
  isFetchingOne: false,
  fetchOneError: null,
  lastOneFetched: null,
  isDeletingJob: false,
  deletedJob: null,
  deleteJobError: null,
  isCreatingJob: false,
  createdJob: null,
  createJobError: null,
}

export function jobsReducer(state = jobsInitialState, action: any) {
  switch (action.type) {
    case types.JOBS_FETCHING:
      return {
        ...state,
        isFetching: true,
        fetchError: null,
      }
    case types.JOBS_FETCH_SUCCESS:
      return {
        ...state,
        isFetching: false,
        records: action.records,
      }
    case types.JOBS_FETCH_ERROR:
      return {
        ...state,
        isFetching: false,
        fetchError: action.error,
      }
    case types.JOBS_FETCHING_ONE:
      return {
        ...state,
        isFetchingOne: true,
        fetchOneError: null,
      }
    case types.JOBS_FETCH_ONE_SUCCESS:
      return {
        ...state,
        isFetchingOne: false,
        records: [...state.records, action.record],
        lastOneFetched: action.record,
      }
    case types.JOBS_FETCH_ONE_ERROR:
      return {
        ...state,
        isFetchingOne: false,
        fetchOneError: action.error,
      }
    case types.JOBS_CREATING_JOB:
      return {
        ...state,
        isCreatingJob: true,
        createdJob: null,
        createJobError: null,
      }
    case types.JOBS_CREATE_JOB_SUCCESS:
      return {
        ...state,
        isCreatingJob: false,
        createdJob: action.job,
        records: [...state.records, action.job],
      }
    case types.JOBS_CREATE_JOB_ERROR:
      return {
        ...state,
        isCreatingJob: false,
        createJobError: action.error,
      }
    case types.JOBS_DISMISS_CREATE_JOB_ERROR:
      return {
        ...state,
        createJobError: null,
      }
    case types.JOBS_DELETING_JOB:
      return {
        ...state,
        records: state.records.filter(job => job.id !== action.job.id),
        isDeletingJob: true,
        deletedJob: action.job,
        deleteJobError: null,
      }
    case types.JOBS_DELETE_JOB_SUCCESS:
      return {
        ...state,
        isDeletingJob: false,
      }
    case types.JOBS_DELETE_JOB_ERROR:
      return {
        ...state,
        records: [...state.records, state.deletedJob],
        isDeletingJob: false,
        deleteJobError: action.error,
      }
    default:
      return state
  }
}
