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
import {scrollIntoView} from '../utils/domUtils'
import {AppState} from '../store'
import {TourState} from '../reducers/tourReducer'

export namespace Tour {
  export function setSteps(steps: TourStep[]) {
    return {...new TourActions.StepsUpdated({ steps })}
  }

  export function start() {
    return {...new TourActions.Started()}
  }

  export function end() {
    return {...new TourActions.Ended()}
  }

  export function goToStep(step: number) {
    return async (dispatch: Dispatch<TourState>, getState: () => AppState) => {
      const state = getState()

      if (state.tour.changing) {
        console.warn('Tour step is in process of changing.')
        return
      }

      const curStep = state.tour.steps.find(i => i.step === state.tour.step)
      const nextStep = state.tour.steps.find(i => i.step === step)

      if (!curStep) {
        console.error('Current tour step could not be found!')
        return
      }

      if (!nextStep) {
        console.error('Next tour step could not be found!')
        return
      }

      dispatch({...new TourActions.StepChanging()})

      try {
        if (curStep.after) {
          await curStep.after()
        }

        if (nextStep.before) {
          await nextStep.before()
        }

        await scrollIntoView(nextStep.selector)
      } catch (error) {
        if (curStep.step > nextStep.step) {
          alert("Sorry, it seems you can't go back from here.")
        }

        dispatch({...new TourActions.StepChangeError({ error })})

        return
      }

      dispatch({...new TourActions.StepChangeSuccess({ step })})
    }
  }
}

export namespace TourActions {
  export class StepsUpdated implements Action {
    static type = 'TOUR_STEPS_UPDATED'
    type = StepsUpdated.type
    constructor(public payload: {
      steps: TourState['steps']
    }) {}
  }

  export class Started implements Action {
    static type = 'TOUR_STARTED'
    type = Started.type
  }

  export class Ended implements Action {
    static type = 'TOUR_ENDED'
    type = Ended.type
  }

  export class StepChanging implements Action {
    static type = 'TOUR_STEP_CHANGING'
    type = StepChanging.type
  }

  export class StepChangeSuccess implements Action {
    static type = 'TOUR_STEP_CHANGE_SUCCESS'
    type = StepChangeSuccess.type
    constructor(public payload: {
      step: TourState['step']
    }) {}
  }

  export class StepChangeError implements Action {
    static type = 'TOUR_STEP_CHANGE_ERROR'
    type = StepChangeError.type
    constructor(public payload: {
      error: TourState['error']
    }) {}
  }
}

export interface TourStep {
  step: number
  selector: string
  title: string | JSX.Element
  body: string | JSX.Element
  horizontalOffset?: number
  verticalOffset?: number
  position?: 'left' | 'right' | 'top' | 'topLeft' | 'bottom' | 'bottomLeft'
  hideArrow?: boolean
  before?: () => void
  after?: () => void
}
