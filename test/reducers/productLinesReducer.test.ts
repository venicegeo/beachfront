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

import {productLinesInitialState, productLinesReducer} from '../../src/reducers/productLinesReducer'
import {types} from '../../src/actions/productLinesActions'

describe('productLinesReducer', () => {
  test('initialState', () => {
    expect(productLinesReducer(undefined, {})).toEqual(productLinesInitialState)
  })

  test('PRODUCT_LINES_FETCHING', () => {
    const state = {
      ...productLinesInitialState,
      fetchError: 'a',
    }

    const action = { type: types.PRODUCT_LINES_FETCHING }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  test('PRODUCT_LINES_FETCH_SUCCESS', () => {
    const state = {
      ...productLinesInitialState,
      isFetching: true,
    }

    const action = {
      type: types.PRODUCT_LINES_FETCH_SUCCESS,
      records: [1, 2, 3],
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      records: action.records,
    })
  })

  test('PRODUCT_LINES_FETCH_ERROR', () => {
    const state = {
      ...productLinesInitialState,
      isFetching: true,
    }

    const action = {
      type: types.PRODUCT_LINES_FETCH_ERROR,
      error: 'a',
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.error,
    })
  })

  test('PRODUCT_LINES_FETCHING_JOBS', () => {
    const state = {
      ...productLinesInitialState,
      fetchJobsError: 'a',
    }

    const action = { type: types.PRODUCT_LINES_FETCHING_JOBS }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetchingJobs: true,
      fetchJobsError: null,
    })
  })

  test('PRODUCT_LINES_FETCH_JOBS_SUCCESS', () => {
    const state = {
      ...productLinesInitialState,
      isFetchingJobs: true,
    }

    const action = {
      type: types.PRODUCT_LINES_FETCH_JOBS_SUCCESS,
      jobs: [1, 2, 3],
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetchingJobs: false,
      jobs: action.jobs,
    })
  })

  test('PRODUCT_LINES_FETCH_JOBS_ERROR', () => {
    const state = {
      ...productLinesInitialState,
      isFetchingJobs: true,
    }

    const action = {
      type: types.PRODUCT_LINES_FETCH_JOBS_ERROR,
      error: 'a',
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isFetchingJobs: false,
      fetchJobsError: action.error,
    })
  })

  test('PRODUCT_LINES_CREATING_PRODUCT_LINE', () => {
    const state = {
      ...productLinesInitialState,
      createdProductLine: 'a',
      createProductLineError: 'a',
    } as any

    const action = { type: types.PRODUCT_LINES_CREATING_PRODUCT_LINE }

    expect(productLinesReducer(state, action)).toEqual({
      ...productLinesInitialState,
      isCreatingProductLine: true,
      createdProductLine: null,
      createProductLineError: null,
    })
  })

  test('PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS', () => {
    const state = {
      ...productLinesInitialState,
      isCreatingProductLine: true,
      records: ['a'],
    } as any

    const action = {
      type: types.PRODUCT_LINES_CREATE_PRODUCT_LINE_SUCCESS,
      createdProductLine: 'a',
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isCreatingProductLine: false,
      createdProductLine: action.createdProductLine,
      records: [...state.records, action.createdProductLine],
    })
  })

  test('PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR', () => {
    const state = {
      ...productLinesInitialState,
      isCreatingProductLine: true,
    }

    const action = {
      type: types.PRODUCT_LINES_CREATE_PRODUCT_LINE_ERROR,
      error: 'a',
    }

    expect(productLinesReducer(state, action)).toEqual({
      ...state,
      isCreatingProductLine: false,
      createProductLineError: action.error,
    })
  })
})
