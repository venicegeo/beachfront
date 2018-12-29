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

import {Action, Dispatch} from 'redux'
import {getClient} from '../api/session'
import {JOB_ENDPOINT} from '../config'
import {JobsState} from '../reducers/jobsReducer'

export namespace Jobs {
  export function fetch() {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({...new JobsActions.Fetching()})

      try {
        const response = await getClient().get(JOB_ENDPOINT) as FetchResponse
        dispatch({...new JobsActions.FetchSuccess({
          records: response.data.jobs.features,
        })})
      } catch (error) {
        dispatch({...new JobsActions.FetchError({ error })})
      }
    }
  }

  export function fetchOne(jobId: string) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({...new JobsActions.FetchingOne()})

      try {
        const response = await getClient().get(`${JOB_ENDPOINT}/${jobId}`) as FetchOneResponse
        dispatch({...new JobsActions.FetchOneSuccess({
          record: response.data.job,
        })})
      } catch (error) {
        dispatch({...new JobsActions.FetchOneError({ error })})
      }
    }
  }

  export function createJob(args: JobsCreateJobArgs) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({...new JobsActions.CreatingJob()})

      try {
        const response = await getClient().post(JOB_ENDPOINT, {
          algorithm_id: args.algorithmId,
          compute_mask: args.computeMask,
          name: args.name,
          planet_api_key: args.catalogApiKey,
          scene_id: args.sceneId,
        })
        dispatch({...new JobsActions.CreateJobSuccess({
          createdJob: response.data.job,
        })})
      } catch (error) {
        dispatch({...new JobsActions.CreateJobError({ error })})
      }
    }
  }

  export function dismissCreateJobError() {
    return {...new JobsActions.CreateJobErrorDismissed()}
  }

  export function deleteJob(job: beachfront.Job) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({...new JobsActions.DeletingJob({ deletedJob: job })})

      try {
        await getClient().delete(`${JOB_ENDPOINT}/${job.id}`)
        dispatch({...new JobsActions.DeleteJobSuccess()})
      } catch (error) {
        dispatch({...new JobsActions.DeleteJobError({ error })})
      }
    }
  }
}

export namespace JobsActions {
  export class Fetching implements Action {
    static type = 'JOBS_FETCHING'
    type = Fetching.type
  }

  export class FetchSuccess implements Action {
    static type = 'JOBS_FETCH_SUCCESS'
    type = FetchSuccess.type
    constructor(public payload: {
      records: JobsState['records']
    }) {}
  }

  export class FetchError implements Action {
    static type = 'JOBS_FETCH_ERROR'
    type = FetchError.type
    constructor(public payload: {
      error: JobsState['fetchError']
    }) {}
  }

  export class FetchingOne implements Action {
    static type = 'JOBS_FETCHING_ONE'
    type = FetchingOne.type
  }

  export class FetchOneSuccess implements Action {
    static type = 'JOBS_FETCH_ONE_SUCCESS'
    type = FetchOneSuccess.type
    constructor(public payload: {
      record: JobsState['records'][0]
    }) {}
  }

  export class FetchOneError implements Action {
    static type = 'JOBS_FETCH_ONE_ERROR'
    type = FetchOneError.type
    constructor(public payload: {
      error: JobsState['fetchOneError']
    }) {}
  }

  export class CreatingJob implements Action {
    static type = 'JOBS_CREATING_JOB'
    type = CreatingJob.type
  }

  export class CreateJobSuccess implements Action {
    static type = 'JOBS_CREATE_JOB_SUCCESS'
    type = CreateJobSuccess.type
    constructor(public payload: {
      createdJob: NonNullable<JobsState['createdJob']>
    }) {}
  }

  export class CreateJobError implements Action {
    static type = 'JOBS_CREATE_JOB_ERROR'
    type = CreateJobError.type
    constructor(public payload: {
      error: JobsState['createJobError']
    }) {}
  }

  export class CreateJobErrorDismissed implements Action {
    static type = 'JOBS_CREATE_JOB_ERROR_DISMISSED'
    type = CreateJobErrorDismissed.type
  }

  export class DeletingJob implements Action {
    static type = 'JOBS_DELETING_JOB'
    type = DeletingJob.type
    constructor(public payload: {
      deletedJob: NonNullable<JobsState['deletedJob']>
    }) {}
  }

  export class DeleteJobSuccess implements Action {
    static type = 'JOBS_DELETE_JOB_SUCCESS'
    type = DeleteJobSuccess.type
  }

  export class DeleteJobError implements Action {
    static type = 'JOBS_DELETE_JOB_ERROR'
    type = DeleteJobError.type
    constructor(public payload: {
      error: JobsState['deleteJobError']
    }) {}
  }
}

export interface JobsCreateJobArgs {
  algorithmId: string
  computeMask: boolean
  name: string
  catalogApiKey: string
  sceneId: string
}

interface FetchResponse {
  data: {
    jobs: {
      features: beachfront.Job[]
    },
  },
}

interface FetchOneResponse {
  data: {
    job: beachfront.Job
  }
}
