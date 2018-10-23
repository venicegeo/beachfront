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

import {types} from '../actions/productLinesActions'

export interface ProductLinesState {
  records: beachfront.ProductLine[]
  fetching: boolean
  fetchError: any
  jobs: beachfront.Job[]
  fetchingJobs: boolean
  fetchJobsError: any
  creatingProductLine: boolean
  createdProductLine: beachfront.ProductLine | null
  createProductLineError: any
}

export const productLinesInitialState: ProductLinesState = {
  records: [],
  fetching: false,
  fetchError: null,
  jobs: [],
  fetchingJobs: false,
  fetchJobsError: null,
  creatingProductLine: false,
  createdProductLine: null,
  createProductLineError: null,
}

export function productLinesReducer(state = productLinesInitialState, action: any) {
  switch (action.type) {
    case types.PRODUCT_LINES_FETCHING:
      return {
        ...state,
        fetching: true,
        fetchError: null,
      }
    case types.PRODUCT_LINES_FETCH_SUCCESS:
      return {
        ...state,
        fetching: false,
        records: action.records,
      }
    case types.PRODUCT_LINES_FETCH_ERROR:
      return {
        ...state,
        fetching: false,
        fetchError: action.error,
      }
    case types.PRODUCT_LINES_FETCHING_JOBS:
      return {
        ...state,
        fetchingJobs: true,
        fetchJobsError: null,
      }
    case types.PRODUCT_LINES_FETCH_JOBS_SUCCESS:
      return {
        ...state,
        fetchingJobs: false,
        jobs: action.jobs,
      }
    case types.PRODUCT_LINES_FETCH_JOBS_ERROR:
      return {
        ...state,
        fetchingJobs: false,
        fetchJobsError: action.error,
      }
    case types.PRODUCT_LINES_CREATING:
      return {
        ...state,
        creatingProductLine: true,
        createdProductLine: null,
        createProductLineError: null,
      }
    case types.PRODUCT_LINES_CREATE_SUCCESS:
      return {
        ...state,
        creatingProductLine: false,
        createdProductLine: action.createdProductLine,
        records: [...state.records, action.createdProductLine],
      }
    case types.PRODUCT_LINES_CREATE_ERROR:
      return {
        ...state,
        creatingProductLine: false,
        createProductLineError: action.error,
      }
    default:
      return state
  }
}
