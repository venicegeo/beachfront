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
import {JOB_ENDPOINT, PRODUCTLINE_ENDPOINT} from '../config'
import {Extent} from '../utils/geometries'
import {ProductLinesState, productLinesInitialState} from '../reducers/productLinesReducer'

export namespace ProductLines {
  export function fetch() {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({...new ProductLinesActions.Fetching()})

      try {
        const response = await getClient().get(PRODUCTLINE_ENDPOINT) as FetchResponse
        dispatch({...new ProductLinesActions.FetchSuccess({
          records: response.data.productlines.features,
        })})
      } catch (error) {
        dispatch({...new ProductLinesActions.FetchError({ error })})
      }
    }
  }

  export function fetchJobs(args: ProductLinesFetchJobsArgs) {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({...new ProductLinesActions.FetchingJobs()})

      try {
        const response = await getClient().get(`${JOB_ENDPOINT}/by_productline/${args.productLineId}?since=${args.sinceDate}`) as FetchJobsResponse
        dispatch({...new ProductLinesActions.FetchJobsSuccess({
          jobs: response.data.jobs.features,
        })})
      } catch (error) {
        dispatch({...new ProductLinesActions.FetchJobsError({ error })})
      }
    }
  }

  export function create(args: ProductLinesCreateArgs) {
    return async (dispatch: Dispatch<ProductLinesState>) => {
      dispatch({...new ProductLinesActions.CreatingProductLine()})

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
        }) as CreateProductLineResponse
        dispatch({...new ProductLinesActions.CreateProductLineSuccess({
          createdProductLine: response.data.productline,
        })})
      } catch (error) {
        dispatch({...new ProductLinesActions.CreateProductLineError({ error })})
      }
    }
  }
}

export namespace ProductLinesActions {
  export class Fetching implements Action {
    static type = 'PRODUCT_LINES_FETCHING'
    type = Fetching.type
  }

  export class FetchSuccess implements Action {
    static type = 'PRODUCT_LINES_FETCH_SUCCESS'
    type = FetchSuccess.type
    constructor(public payload: {
      records: typeof productLinesInitialState.records
    }) {}
  }

  export class FetchError implements Action {
    static type = 'PRODUCT_LINES_FETCH_ERROR'
    type = FetchError.type
    constructor(public payload: {
      error: typeof productLinesInitialState.fetchError
    }) {}
  }

  export class FetchingJobs implements Action {
    static type = 'PRODUCT_LINES_FETCHING_JOBS'
    type = FetchingJobs.type
  }

  export class FetchJobsSuccess implements Action {
    static type = 'PRODUCT_LINES_FETCH_JOBS_SUCCESS'
    type = FetchJobsSuccess.type
    constructor(public payload: {
      jobs: typeof productLinesInitialState.jobs
    }) {}
  }

  export class FetchJobsError implements Action {
    static type = 'PRODUCT_LINES_FETCH_JOBS_ERROR'
    type = FetchJobsError.type
    constructor(public payload: {
      error: typeof productLinesInitialState.fetchJobsError
    }) {}
  }

  export class CreatingProductLine implements Action {
    static type = 'PRODUCT_LINES_CREATING_PRODUCT_LINE'
    type = CreatingProductLine.type
  }

  export class CreateProductLineSuccess implements Action {
    static type = 'PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS'
    type = CreateProductLineSuccess.type
    constructor(public payload: {
      createdProductLine: NonNullable<typeof productLinesInitialState.createdProductLine>
    }) {}
  }

  export class CreateProductLineError implements Action {
    static type = 'PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR'
    type = CreateProductLineError.type
    constructor(public payload: {
      error: typeof productLinesInitialState.createProductLineError
    }) {}
  }
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

interface FetchResponse {
  data: {
    productlines: {
      features: beachfront.ProductLine[]
    }
  }
}

interface FetchJobsResponse {
  data: {
    jobs: {
      features: beachfront.Job[]
    }
  }
}

interface CreateProductLineResponse {
  data: {
    productline: beachfront.ProductLine
  }
}
