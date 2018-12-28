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
import {TourActions} from '../../src/actions/tourActions'

describe('tourReducer', () => {
  test('initialState', () => {
    expect(tourReducer(undefined, { type: null })).toEqual(tourInitialState)
  })

  test('TOUR_STEPS_UPDATED', () => {
    const action = {
      type: TourActions.StepsUpdated.type,
      payload: {
        steps: 'a',
      },
    }

    expect(tourReducer(tourInitialState, action)).toEqual({
      ...tourInitialState,
      steps: action.payload.steps,
    })
  })

  test('TOUR_STARTED', () => {
    const state = {
      ...tourInitialState,
      changing: true,
      step: 5,
      error: 'a',
    } as any

    const action = { type: TourActions.Started.type }

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
    } as any

    const action = { type: TourActions.Ended.type }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      inProgress: false,
      changing: false,
      error: null,
    })
  })

  test('TOUR_STEP_CHANGING', () => {
    const action = { type: TourActions.StepChanging.type }

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
      type: TourActions.StepChangeSuccess.type,
      payload: {
        step: 'a',
      },
    }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      changing: false,
      step: action.payload.step,
    })
  })

  test('TOUR_STEP_CHANGE_ERROR', () => {
    const state = {
      ...tourInitialState,
      changing: true,
    }

    const action = {
      type: TourActions.StepChangeError.type,
      payload: {
        error: 'a',
      },
    }

    expect(tourReducer(state, action)).toEqual({
      ...state,
      changing: false,
      error: action.payload.error,
    })
  })
})
