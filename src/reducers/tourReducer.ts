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
import {TourActions as Actions, TourStep} from '../actions/tourActions'

export interface TourState {
  inProgress: boolean
  changing: boolean
  step: number
  error: Error | null
  steps: TourStep[]
}

export const tourInitialState: TourState = {
  inProgress: false,
  changing: false,
  step: 1,
  error: null,
  steps: [],
}

export function tourReducer(state = tourInitialState, action: Action): TourState {
  switch (action.type) {
    case Actions.StepsUpdated.type: {
      const payload = (action as Actions.StepsUpdated).payload
      return {
        ...state,
        steps: payload.steps,
      }
    }
    case Actions.Started.type:
      return {
        ...state,
        inProgress: true,
        changing: false,
        step: 1,
        error: null,
      }
    case Actions.Ended.type:
      return {
        ...state,
        inProgress: false,
        changing: false,
        error: null,
      }
    case Actions.StepChanging.type:
      return {
        ...state,
        changing: true,
      }
    case Actions.StepChangeSuccess.type: {
      const payload = (action as Actions.StepChangeSuccess).payload
      return {
        ...state,
        changing: false,
        step: payload.step,
      }
    }
    case Actions.StepChangeError.type: {
      const payload = (action as Actions.StepChangeError).payload
      return {
        ...state,
        changing: false,
        error: payload.error,
      }
    }
    default:
      return state
  }
}
