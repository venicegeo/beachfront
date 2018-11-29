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

import {TourStep, tourTypes} from '../actions/tourActions'

export interface TourState {
  inProgress: boolean
  changing: boolean
  step: number
  error: any
  steps: TourStep[]
}

export const tourInitialState: TourState = {
  inProgress: false,
  changing: false,
  step: 1,
  error: null,
  steps: [],
}

export function tourReducer(state = tourInitialState, action: any) {
  switch (action.type) {
    case tourTypes.TOUR_STEPS_UPDATED:
      return {
        ...state,
        steps: action.steps,
      }
    case tourTypes.TOUR_STARTED:
      return {
        ...state,
        inProgress: true,
        changing: false,
        step: 1,
        error: null,
      }
    case tourTypes.TOUR_ENDED:
      return {
        ...state,
        inProgress: false,
        changing: false,
        error: null,
      }
    case tourTypes.TOUR_STEP_CHANGING:
      return {
        ...state,
        changing: true,
      }
    case tourTypes.TOUR_STEP_CHANGE_SUCCESS:
      return {
        ...state,
        changing: false,
        step: action.step,
      }
    case tourTypes.TOUR_STEP_CHANGE_ERROR:
      return {
        ...state,
        changing: false,
        error: action.error,
      }
    default:
      return state
  }
}
