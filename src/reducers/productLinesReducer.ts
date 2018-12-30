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
import {ProductLinesActions as Actions} from '../actions/productLinesActions'
import {RequestError} from '../utils/requestError'

export interface ProductLinesState {
  readonly records: beachfront.ProductLine[]
  readonly isFetching: boolean
  readonly fetchError: RequestError | null
  readonly jobs: beachfront.Job[]
  readonly isFetchingJobs: boolean
  readonly fetchJobsError: RequestError | null
  readonly isCreatingProductLine: boolean
  readonly createdProductLine: beachfront.ProductLine | null
  readonly createProductLineError: RequestError | null
}

export const productLinesInitialState: ProductLinesState = {
  records: [],
  isFetching: false,
  fetchError: null,
  jobs: [],
  isFetchingJobs: false,
  fetchJobsError: null,
  isCreatingProductLine: false,
  createdProductLine: null,
  createProductLineError: null,
}

export function productLinesReducer(state = productLinesInitialState, action: Action): ProductLinesState {
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
    case Actions.FetchingJobs.type:
      return {
        ...state,
        isFetchingJobs: true,
        fetchJobsError: null,
      }
    case Actions.FetchJobsSuccess.type: {
      const payload = (action as Actions.FetchJobsSuccess).payload
      return {
        ...state,
        isFetchingJobs: false,
        jobs: payload.jobs,
      }
    }
    case Actions.FetchJobsError.type: {
      const payload = (action as Actions.FetchJobsError).payload
      return {
        ...state,
        isFetchingJobs: false,
        fetchJobsError: payload.error,
      }
    }
    case Actions.CreatingProductLine.type:
      return {
        ...state,
        isCreatingProductLine: true,
        createdProductLine: null,
        createProductLineError: null,
      }
    case Actions.CreateProductLineSuccess.type: {
      const payload = (action as Actions.CreateProductLineSuccess).payload
      return {
        ...state,
        isCreatingProductLine: false,
        createdProductLine: payload.createdProductLine,
        records: [...state.records, payload.createdProductLine],
      }
    }
    case Actions.CreateProductLineError.type: {
      const payload = (action as Actions.CreateProductLineError).payload
      return {
        ...state,
        isCreatingProductLine: false,
        createProductLineError: payload.error,
      }
    }
    default:
      return state
  }
}
