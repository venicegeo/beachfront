/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
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

import {getClient} from '../api/session'
import {JOB_ENDPOINT, PRODUCTLINE_ENDPOINT} from '../config'

export const types = {
  PRODUCT_LINES_FETCHING: 'PRODUCT_LINES_FETCHING',
  PRODUCT_LINES_FETCH_SUCCESS: 'PRODUCT_LINES_FETCH_SUCCESS',
  PRODUCT_LINES_FETCH_ERROR: 'PRODUCT_LINES_FETCH_ERROR',
  PRODUCT_LINES_FETCHING_JOBS: 'PRODUCT_LINES_FETCHING_JOBS',
  PRODUCT_LINES_FETCH_JOBS_SUCCESS: 'PRODUCT_LINES_FETCH_JOBS_SUCCESS',
  PRODUCT_LINES_FETCH_JOBS_ERROR: 'PRODUCT_LINES_FETCH_JOBS_ERROR',
  PRODUCT_LINES_CREATING: 'PRODUCT_LINES_CREATING',
  PRODUCT_LINES_CREATE_SUCCESS: 'PRODUCT_LINES_CREATE_SUCCESS',
  PRODUCT_LINES_CREATE_ERROR: 'PRODUCT_LINES_CREATE_ERROR',
}

export interface ParamsProductLinesCreate {
  algorithmId: string
  bbox: [number, number, number, number]
  category: string | null
  dateStart: string
  dateStop: string
  maxCloudCover: number
  name: string
}

export interface ParamsProductLinesFetchJobs {
  productLineId: string
  sinceDate: string
}

export const productLinesActions = {
  fetch() {
    return async dispatch => {
      dispatch({ type: types.PRODUCT_LINES_FETCHING })

      try {
        const response = await getClient().get(PRODUCTLINE_ENDPOINT)
        dispatch({
          type: types.PRODUCT_LINES_FETCH_SUCCESS,
          records: response.data.productlines.features,
        })
      } catch (error) {
        dispatch({
          type: types.PRODUCT_LINES_FETCH_ERROR,
          error,
        })
      }
    }
  },

  fetchJobs(args: ParamsProductLinesFetchJobs) {
    return async dispatch => {
      dispatch({ type: types.PRODUCT_LINES_FETCHING_JOBS })

      try {
        const response = await getClient().get(`${JOB_ENDPOINT}/by_productline/${args.productLineId}?since=${args.sinceDate}`)
        dispatch({
          type: types.PRODUCT_LINES_FETCH_JOBS_SUCCESS,
          jobs: response.data.jobs.features,
        })
      } catch (error) {
        dispatch({
          type: types.PRODUCT_LINES_FETCH_JOBS_ERROR,
          error,
        })
      }
    }
  },

  create(args: ParamsProductLinesCreate) {
    return async dispatch => {
      dispatch({ type: types.PRODUCT_LINES_CREATING })

      const [minX, minY, maxX, maxY] = args.bbox
      try {
        const response = await getClient().post(PRODUCTLINE_ENDPOINT, {
          algorithm_id: args.algorithmId,
          category: args.category,
          max_cloud_cover: args.maxCloudCover,
          min_x: minX,
          min_y: minY,
          max_x: maxX,
          max_y: maxY,
          name: args.name,
          spatial_filter_id: null,
          start_on: args.dateStart,
          stop_on: args.dateStop,
        })
        dispatch({
          type: types.PRODUCT_LINES_CREATE_SUCCESS,
          createdProductLine: response.data.productline,
        })
      } catch (error) {
        dispatch({
          type: types.PRODUCT_LINES_CREATE_ERROR,
          error,
        })
      }
    }
  },
}
