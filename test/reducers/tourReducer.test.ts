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

import {tourInitialState, tourReducer} from '../../src/reducers/tourReducer'
import {tourTypes} from '../../src/actions/tourActions'

describe('tourReducer', () => {
  test('initialState', () => {
    expect(tourReducer(undefined, {})).toEqual(tourInitialState)
  })

  test('TOUR_SET_STEPS', () => {
    const action = {
      type: tourTypes.TOUR_SET_STEPS,
      steps: [1, 2, 3],
    }

    expect(tourReducer(tourInitialState, action)).toEqual({
      ...tourInitialState,
      steps: action.steps,
    })
  })

  test('TOUR_STARTED', () => {
    const state = {
      ...tourInitialState,
      changing: true,
      step: 5,
      error: 'a',
    }

    const action = { type: tourTypes.TOUR_STARTED }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      inProgress: true,
      changing: false,
      step: 1,
      error: null,
    })
  })

  test('TOUR_ENDED', () => {
    const state = {
      ...tourInitialState,
      inProgress: true,
      changing: true,
      error: 'a',
    }

    const action = { type: tourTypes.TOUR_ENDED }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      inProgress: false,
      changing: false,
      error: null,
    })
  })

  test('TOUR_STEP_CHANGING', () => {
    const action = { type: tourTypes.TOUR_STEP_CHANGING }

    expect(tourReducer(tourInitialState, action)).toEqual({
      ...tourInitialState,
      changing: true,
    })
  })

  test('TOUR_STEP_CHANGE_SUCCESS', () => {
    const state = {
      ...tourInitialState,
      changing: true,
    }

    const action = {
      type: tourTypes.TOUR_STEP_CHANGE_SUCCESS,
      step: 2,
    }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      changing: false,
      step: action.step,
    })
  })

  test('TOUR_STEP_CHANGE_ERROR', () => {
    const state = {
      ...tourInitialState,
      changing: true,
    }

    const action = {
      type: tourTypes.TOUR_STEP_CHANGE_ERROR,
      error: 'a',
    }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      changing: false,
      error: action.error,
    })
  })
})
