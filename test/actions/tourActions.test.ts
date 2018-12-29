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
import {Tour, TourActions} from '../../src/actions/tourActions'
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

      await store.dispatch(Tour.setSteps(mockSteps as any))

      expect(store.getActions()).toEqual([
        {
          type: TourActions.StepsUpdated.type,
          payload: {
            steps: mockSteps,
          },
        },
      ])
    })
  })

  describe('start()', () => {
    test('success', async () => {
      await store.dispatch(Tour.start())

      expect(store.getActions()).toEqual([
        { type: TourActions.Started.type },
      ])
    })
  })

  describe('end()', () => {
    test('success', async () => {
      await store.dispatch(Tour.end())

      expect(store.getActions()).toEqual([
        { type: TourActions.Ended.type },
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

      await store.dispatch(Tour.goToStep(2) as any)

      expect(mockSteps[0].after!.callCount).toEqual(1)
      expect(mockSteps[1].before!.callCount).toEqual(1)
      expect(scrollIntoViewStub.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: TourActions.StepChanging.type },
        {
          type: TourActions.StepChangeSuccess.type,
          payload: {
            step: 2,
          },
        },
      ])
    })

    test('"after" callback error', async () => {
      const mockSteps = [
        {
          step: 1,
          after: () => {
            throw Error('error')
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

      await store.dispatch(Tour.goToStep(2) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: TourActions.StepChanging.type })
      expect(actions[1].type).toEqual(TourActions.StepChangeError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('"before" callback error', async () => {
      const mockSteps = [
        {
          step: 1,
        },
        {
          step: 2,
          before: () => {
            throw Error('error')
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

      await store.dispatch(Tour.goToStep(2) as any)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: TourActions.StepChanging.type })
      expect(actions[1].type).toEqual(TourActions.StepChangeError.type)
      expect(actions[1].payload).toHaveProperty('error')
    })

    test('do nothing if already changing steps', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          changing: true,
        },
      }) as any

      await store.dispatch(Tour.goToStep(2) as any)

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

      await store.dispatch(Tour.goToStep(1) as any)

      expect(alertSpy.callCount).toEqual(1)

      const actions = store.getActions()
      expect(actions.length).toEqual(2)
      expect(actions[0]).toEqual({ type: TourActions.StepChanging.type })
      expect(actions[1].type).toEqual(TourActions.StepChangeError.type)
      expect(actions[1].payload).toHaveProperty('error')

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

      await store.dispatch(Tour.goToStep(2) as any)

      expect(store.getActions()).toEqual([
        { type: TourActions.StepChanging.type },
        {
          type: TourActions.StepChangeSuccess.type,
          payload: {
            step: 2,
          },
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

      await store.dispatch(Tour.goToStep(3) as any)

      expect(mockSteps[0].after!.callCount).toEqual(1)
      expect(mockSteps[1].before!.callCount).toEqual(0)
      expect(mockSteps[1].after!.callCount).toEqual(0)
      expect(mockSteps[2].before!.callCount).toEqual(1)

      expect(store.getActions()).toEqual([
        { type: TourActions.StepChanging.type },
        {
          type: TourActions.StepChangeSuccess.type,
          payload: {
            step: 3,
          },
        },
      ])
    })

    test('missing current step', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: [{ step: 1 }],
          step: 0,
        },
      }) as any

      await store.dispatch(Tour.goToStep(1) as any)

      expect(store.getActions()).toEqual([])
    })

    test('missing next step', async () => {
      store = mockStore({
        ...initialState,
        tour: {
          ...tourInitialState,
          steps: [{ step: 1 }],
          step: 1,
        },
      }) as any

      await store.dispatch(Tour.goToStep(2) as any)

      expect(store.getActions()).toEqual([])
    })
  })
})
