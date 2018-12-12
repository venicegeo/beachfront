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
import {JOB_ENDPOINT, PRODUCTLINE_ENDPOINT} from '../config'
import {Extent} from '../utils/geometries'
import {ProductLinesState} from '../reducers/productLinesReducer'

export const productLinesTypes: ActionTypes = {
  PRODUCT_LINES_FETCHING: 'PRODUCT_LINES_FETCHING',
  PRODUCT_LINES_FETCH_SUCCESS: 'PRODUCT_LINES_FETCH_SUCCESS',
  PRODUCT_LINES_FETCH_ERROR: 'PRODUCT_LINES_FETCH_ERROR',
  PRODUCT_LINES_FETCHING_JOBS: 'PRODUCT_LINES_FETCHING_JOBS',
  PRODUCT_LINES_FETCH_JOBS_SUCCESS: 'PRODUCT_LINES_FETCH_JOBS_SUCCESS',
  PRODUCT_LINES_FETCH_JOBS_ERROR: 'PRODUCT_LINES_FETCH_JOBS_ERROR',
  PRODUCT_LINES_CREATING_PRODUCT_LINE: 'PRODUCT_LINES_CREATING_PRODUCT_LINE',
  PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS: 'PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS',
  PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR: 'PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR',
}

export interface ProductLinesCreateArgs {
  algorithmId: string
  bbox: Extent
  category: string | null
  dateStart: string
  dateStop: string
  maxCloudCover: number
  name: string
}

export interface ProductLinesFetchJobsArgs {
  productLineId: string
  sinceDate: string
}

export const productLinesActions = {
  fetch() {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({ type: productLinesTypes.PRODUCT_LINES_FETCHING })

      try {
        const response = await getClient().get(PRODUCTLINE_ENDPOINT)
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_FETCH_SUCCESS,
          records: response.data.productlines.features,
        })
      } catch (error) {
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_FETCH_ERROR,
          error,
        })
      }
    }
  },

  fetchJobs(args: ProductLinesFetchJobsArgs) {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({ type: productLinesTypes.PRODUCT_LINES_FETCHING_JOBS })

      try {
        const response = await getClient().get(`${JOB_ENDPOINT}/by_productline/${args.productLineId}?since=${args.sinceDate}`)
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_FETCH_JOBS_SUCCESS,
          jobs: response.data.jobs.features,
        })
      } catch (error) {
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_FETCH_JOBS_ERROR,
          error,
        })
      }
    }
  },

  create(args: ProductLinesCreateArgs) {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({ type: productLinesTypes.PRODUCT_LINES_CREATING_PRODUCT_LINE })

      try {
        const response = await getClient().post(PRODUCTLINE_ENDPOINT, {
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
        })
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS,
          createdProductLine: response.data.productline,
        })
      } catch (error) {
        dispatch({
          type: productLinesTypes.PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR,
          error,
        })
      }
    }
  },
}
