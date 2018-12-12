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

import thunk from 'redux-thunk'
import configureStore, {MockStoreEnhanced} from 'redux-mock-store'
import * as sinon from 'sinon'
import {SinonStub} from 'sinon'
import {tourActions, tourTypes} from '../../src/actions/tourActions'
import {tourInitialState} from '../../src/reducers/tourReducer'
import * as domUtils from '../../src/utils/domUtils'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

describe('tourActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store = mockStore(initialState) as any
  })

  describe('setSteps()', () => {
    test('success', async () => {
      const mockSteps = [1, 2, 3]

      await store.dispatch(tourActions.setSteps(mockSteps as any))

      expect(store.getActions()).toEqual([
        {
          type: tourTypes.TOUR_STEPS_UPDATED,
          steps: mockSteps,
        },
      ])
    })
  })

  describe('start()', () => {
    test('success', async () => {
      await store.dispatch(tourActions.start())

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STARTED },
      ])
    })
  })

  describe('end()', () => {
    test('success', async () => {
      await store.dispatch(tourActions.end())

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_ENDED },
      ])
    })
  })

  describe('goToStep()', () => {
    let scrollIntoViewStub: SinonStub

    beforeAll(() => {
      scrollIntoViewStub = sinon.stub(domUtils, 'scrollIntoView')
    })

    afterAll(() => {
      scrollIntoViewStub.restore()
    })

    test('success', async () => {
      const mockSteps = [
        {
          step: 1,
          after: sinon.spy(),
        },
        {
          step: 2,
          before: sinon.spy(),
        },
      ]

      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: mockSteps,
        },
      }) as any

      await store.dispatch(tourActions.goToStep(2) as any)

      expect(mockSteps[0].after!.callCount).toEqual(1)
      expect(mockSteps[1].before!.callCount).toEqual(1)
      expect(scrollIntoViewStub.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_SUCCESS,
          step: 2,
        },
      ])
    })

    test('"after" callback error', async () => {
      const mockSteps = [
        {
          step: 1,
          after: () => {
            throw Error('after error')
          },
        },
        {
          step: 2,
        },
      ]

      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: mockSteps,
        },
      }) as any

      await store.dispatch(tourActions.goToStep(2) as any)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_ERROR,
          error: 'after error',
        },
      ])
    })

    test('"before" callback error', async () => {
      const mockSteps = [
        {
          step: 1,
        },
        {
          step: 2,
          before: () => {
            throw Error('before error')
          },
        },
      ]

      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: mockSteps,
        },
      }) as any

      await store.dispatch(tourActions.goToStep(2) as any)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_ERROR,
          error: 'before error',
        },
      ])
    })

    test('do nothing if already changing steps', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          changing: true,
        },
      }) as any

      await store.dispatch(tourActions.goToStep(2) as any)

      expect(store.getActions()).toEqual([])
    })

    test('show alert if an error occurs when trying to step backwards', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: [
            {
              step: 1,
              before: () => {
                throw Error('error')
              },
            },
            { step: 2 },
          ],
          step: 2,
        },
      }) as any

      const alertSpy = sinon.spy(window, 'alert')

      await store.dispatch(tourActions.goToStep(1) as any)

      expect(alertSpy.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_ERROR,
          error: 'error',
        },
      ])

      alertSpy.restore()
    })

    test('handle undefined "before" and "after" gracefully', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: [
            { step: 1 },
            { step: 2 },
          ],
        },
      }) as any

      await store.dispatch(tourActions.goToStep(2) as any)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_SUCCESS,
          step: 2,
        },
      ])
    })

    test('skip steps', async () => {
      const mockSteps = [
        {
          step: 1,
          after: sinon.spy(),
        },
        {
          step: 2,
          before: sinon.spy(),
          after: sinon.spy(),
        },
        {
          step: 3,
          before: sinon.spy(),
        },
      ]

      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: mockSteps,
        },
      }) as any

      await store.dispatch(tourActions.goToStep(3) as any)

      expect(mockSteps[0].after!.callCount).toEqual(1)
      expect(mockSteps[1].before!.callCount).toEqual(0)
      expect(mockSteps[1].after!.callCount).toEqual(0)
      expect(mockSteps[2].before!.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: tourTypes.TOUR_STEP_CHANGING },
        {
          type: tourTypes.TOUR_STEP_CHANGE_SUCCESS,
          step: 3,
        },
      ])
    })
  })
})
