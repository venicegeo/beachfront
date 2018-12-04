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

import {algorithmsInitialState, algorithmsReducer} from '../../src/reducers/algorithmsReducer'
import {algorithmsTypes} from '../../src/actions/algorithmsActions'

describe('algorithmsReducer', () => {
  test('initial state', () => {
    expect(algorithmsReducer(undefined, {})).toEqual(algorithmsInitialState)
  })

  test('ALGORITHMS_DESERIALIZED', () => {
    const action = {
      type: algorithmsTypes.ALGORITHMS_DESERIALIZED,
      deserialized: {
        a: 'a',
      },
    }

    expect(algorithmsReducer(algorithmsInitialState, action)).toEqual({
      ...algorithmsInitialState,
      ...action.deserialized,
    })
  })

  test('ALGORITHMS_FETCHING', () => {
    const state = {
      ...algorithmsInitialState,
      fetchError: 'a',
    }

    const action = { type: algorithmsTypes.ALGORITHMS_FETCHING }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  test('ALGORITHMS_FETCH_SUCCESS', () => {
    const state = {
      ...algorithmsInitialState,
      isFetching: true,
    }

    const action = {
      type: algorithmsTypes.ALGORITHMS_FETCH_SUCCESS,
      records: [1, 2, 3],
    }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      records: action.records,
    })
  })

  test('ALGORITHMS_FETCH_ERROR', () => {
    const state = {
      ...algorithmsInitialState,
      isFetching: true,
    }

    const action = {
      type: algorithmsTypes.ALGORITHMS_FETCH_ERROR,
      error: 'a',
    }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.error,
    })
  })
})
