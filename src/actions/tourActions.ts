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

import {scrollIntoView} from '../utils/domUtils'
import {AppState} from '../store'

export const tourTypes = {
  TOUR_STEPS_UPDATED: 'TOUR_STEPS_UPDATED',
  TOUR_STARTED: 'TOUR_STARTED',
  TOUR_ENDED: 'TOUR_ENDED',
  TOUR_STEP_CHANGING: 'TOUR_STEP_CHANGING',
  TOUR_STEP_CHANGE_ERROR: 'TOUR_STEP_CHANGE_ERROR',
  TOUR_STEP_CHANGE_SUCCESS: 'TOUR_STEP_CHANGE_SUCCESS',
}

export interface TourStep {
  step: number
  selector: string
  title: any
  body: any
  position?: string
  hideArrow?: boolean
  verticalOffset?: number
  horizontalOffset?: number
  before?(): void
  after?(): void
}

export const tourActions = {
  setSteps(steps: TourStep[]) {
    return {
      type: tourTypes.TOUR_STEPS_UPDATED,
      steps,
    }
  },

  start() {
    return { type: tourTypes.TOUR_STARTED }
  },

  end() {
    return { type: tourTypes.TOUR_ENDED }
  },

  goToStep(step: number) {
    return async (dispatch, getState) => {
      const state: AppState = getState()

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

      dispatch({ type: tourTypes.TOUR_STEP_CHANGING })

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

        dispatch({
          type: tourTypes.TOUR_STEP_CHANGE_ERROR,
          error: error.message,
        })

        return
      }

      dispatch({
        type: tourTypes.TOUR_STEP_CHANGE_SUCCESS,
        step,
      })
    }
  },
}
