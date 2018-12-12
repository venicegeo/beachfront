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

import {Dispatch} from 'redux'
import {getClient} from '../api/session'
import {JOB_ENDPOINT} from '../config'
import {JobsState} from '../reducers/jobsReducer'

export const jobsTypes: ActionTypes = {
  JOBS_FETCHING: 'JOBS_FETCHING',
  JOBS_FETCH_SUCCESS: 'JOBS_FETCH_SUCCESS',
  JOBS_FETCH_ERROR: 'JOBS_FETCH_ERROR',
  JOBS_FETCHING_ONE: 'JOBS_FETCHING_ONE',
  JOBS_FETCH_ONE_SUCCESS: 'JOBS_FETCH_ONE_SUCCESS',
  JOBS_FETCH_ONE_ERROR: 'JOBS_FETCH_ONE_ERROR',
  JOBS_CREATING_JOB: 'JOBS_CREATING_JOB',
  JOBS_CREATE_JOB_SUCCESS: 'JOBS_CREATE_JOB_SUCCESS',
  JOBS_CREATE_JOB_ERROR: 'JOBS_CREATE_JOB_ERROR',
  JOBS_CREATE_JOB_ERROR_DISMISSED: 'JOBS_CREATE_JOB_ERROR_DISMISSED',
  JOBS_DELETING_JOB: 'JOBS_DELETING_JOB',
  JOBS_DELETE_JOB_SUCCESS: 'JOBS_DELETE_JOB_SUCCESS',
  JOBS_DELETE_JOB_ERROR: 'JOBS_DELETE_JOB_ERROR',
}

export interface JobsCreateJobArgs {
  algorithmId: string
  computeMask: boolean
  name: string
  catalogApiKey: string
  sceneId: string
}

export const jobsActions = {
  fetch() {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({ type: jobsTypes.JOBS_FETCHING })

      try {
        const response = await getClient().get(JOB_ENDPOINT)
        dispatch({
          type: jobsTypes.JOBS_FETCH_SUCCESS,
          records: response.data.jobs.features,
        })
      } catch (error) {
        dispatch({
          type: jobsTypes.JOBS_FETCH_ERROR,
          error,
        })
      }
    }
  },

  fetchOne(jobId: string) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({ type: jobsTypes.JOBS_FETCHING_ONE })

      try {
        const response = await getClient().get(`${JOB_ENDPOINT}/${jobId}`)
        dispatch({
          type: jobsTypes.JOBS_FETCH_ONE_SUCCESS,
          record: response.data.job,
        })
      } catch (error) {
        dispatch({
          type: jobsTypes.JOBS_FETCH_ONE_ERROR,
          error,
        })
      }
    }
  },

  createJob(args: JobsCreateJobArgs) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({ type: jobsTypes.JOBS_CREATING_JOB })

      try {
        const response = await getClient().post(JOB_ENDPOINT, {
          algorithm_id: args.algorithmId,
          compute_mask: args.computeMask,
          name: args.name,
          planet_api_key: args.catalogApiKey,
          scene_id: args.sceneId,
        })
        dispatch({
          type: jobsTypes.JOBS_CREATE_JOB_SUCCESS,
          createdJob: response.data.job,
        })
      } catch (error) {
        dispatch({
          type: jobsTypes.JOBS_CREATE_JOB_ERROR,
          error,
        })
      }
    }
  },

  dismissCreateJobError() {
    return { type: jobsTypes.JOBS_CREATE_JOB_ERROR_DISMISSED }
  },

  deleteJob(job: beachfront.Job) {
    return async (dispatch: Dispatch<JobsState>) => {
      dispatch({
        type: jobsTypes.JOBS_DELETING_JOB,
        deletedJob: job,
      })

      try {
        await getClient().delete(`${JOB_ENDPOINT}/${job.id}`)
        dispatch({ type: jobsTypes.JOBS_DELETE_JOB_SUCCESS })
      } catch (error) {
        dispatch({
          type: jobsTypes.JOBS_DELETE_JOB_ERROR,
          error,
        })
      }
    }
  },
}
