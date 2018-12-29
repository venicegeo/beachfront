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

import {Action} from 'redux'
import {JobsActions as Actions} from '../actions/jobsActions'

export type JobsState = {
  records: beachfront.Job[]
  isFetching: boolean
  fetchError: any
  initialFetchComplete: boolean
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

export const jobsInitialState: JobsState = {
  records: Array<beachfront.Job>(),
  isFetching: false,
  fetchError: null,
  initialFetchComplete: false,
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

export function jobsReducer(state = jobsInitialState, action: Action): JobsState {
  switch (action.type) {
    case Actions.Fetching.type:
      return {
        ...state,
        isFetching: true,
        fetchError: null,
      }
    case Actions.FetchSuccess.type: {
      const payload = (action as Actions.FetchSuccess).payload
      return {
        ...state,
        isFetching: false,
        records: payload.records,
        initialFetchComplete: true,
      }
    }
    case Actions.FetchError.type: {
      const payload = (action as Actions.FetchError).payload
      return {
        ...state,
        isFetching: false,
        fetchError: payload.error,
      }
    }
    case Actions.FetchingOne.type:
      return {
        ...state,
        isFetchingOne: true,
        fetchOneError: null,
      }
    case Actions.FetchOneSuccess.type: {
      const payload = (action as Actions.FetchOneSuccess).payload
      return {
        ...state,
        isFetchingOne: false,
        records: [...state.records, payload.record],
        lastOneFetched: payload.record,
      }
    }
    case Actions.FetchOneError.type: {
      const payload = (action as Actions.FetchOneError).payload
      return {
        ...state,
        isFetchingOne: false,
        fetchOneError: payload.error,
      }
    }
    case Actions.CreatingJob.type:
      return {
        ...state,
        isCreatingJob: true,
        createdJob: null,
        createJobError: null,
      }
    case Actions.CreateJobSuccess.type: {
      const payload = (action as Actions.CreateJobSuccess).payload
      return {
        ...state,
        isCreatingJob: false,
        createdJob: payload.createdJob,
        records: [...state.records, payload.createdJob],
      }
    }
    case Actions.CreateJobError.type: {
      const payload = (action as Actions.CreateJobError).payload
      return {
        ...state,
        isCreatingJob: false,
        createJobError: payload.error,
      }
    }
    case Actions.CreateJobErrorDismissed.type:
      return {
        ...state,
        createJobError: null,
      }
    case Actions.DeletingJob.type: {
      const payload = (action as Actions.DeletingJob).payload
      return {
        ...state,
        records: state.records.filter(job => job.id !== payload.deletedJob.id),
        isDeletingJob: true,
        deletedJob: payload.deletedJob,
        deleteJobError: null,
      }
    }
    case Actions.DeleteJobSuccess.type:
      return {
        ...state,
        isDeletingJob: false,
      }
    case Actions.DeleteJobError.type: {
      const payload = (action as Actions.DeleteJobError).payload
      return {
        ...state,
        records: [...state.records, state.deletedJob!],
        isDeletingJob: false,
        deleteJobError: payload.error,
      }
    }
    default:
      return state
  }
}
