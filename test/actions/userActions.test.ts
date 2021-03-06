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
import {SinonSpy} from 'sinon'
import {User, UserActions} from '../../src/actions/userActions'
import {userInitialState} from '../../src/reducers/userReducer'
import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'
import {getClient} from '../../src/api/session'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)
let clientSpies: {[key: string]: SinonSpy} = {
  get: sinon.spy(getClient(), 'get'),
}

describe('userActions', () => {
  beforeEach(() => {
    sessionStorage.clear()
    jest.clearAllMocks()
    store = mockStore(initialState) as any
  })

  afterEach(() => {
    mockAdapter.reset()
    Object.keys(clientSpies).forEach(name => clientSpies[name].resetHistory())
  })

  beforeAll(() => {
    // Mock window location so that we can check updates to it.
    const windowLocation = JSON.stringify(window.location)
    delete window.location
    Object.defineProperty(window, 'location', {
      value: JSON.parse(windowLocation),
    })
  })

  afterAll(() => {
    mockAdapter.restore()
    Object.keys(clientSpies).forEach(name => clientSpies[name].restore())
  })

  describe('logout()', () => {
    test('success', async () => {
      await store.dispatch(User.logout())

      expect(store.getActions()).toEqual([
        { type: UserActions.LoggedOut.type },
      ])
    })
  })

  describe('clearSession()', () => {
    test('success', async () => {
      await store.dispatch(User.clearSession())

      expect(sessionStorage.clear).toHaveBeenCalledTimes(1)

      expect(store.getActions()).toEqual([
        { type: UserActions.SessionCleared.type },
      ])
    })
  })

  describe('sessionLogout()', () => {
    test('success', async () => {
      const mockResponse = '/path'
      mockAdapter.onGet('oauth/logout').reply(200, mockResponse)

      await store.dispatch(User.sessionLogout())

      expect(sessionStorage.clear).toHaveBeenCalledTimes(1)
      expect(clientSpies.get.callCount).toEqual(1)
      expect(clientSpies.get.args[0]).toEqual(['/oauth/logout'])

      expect(store.getActions()).toEqual([
        { type: UserActions.SessionLoggedOut.type },
      ])

      await new Promise<void>(resolve => {
        setTimeout(() => {
          expect(window.location.href).toEqual(mockResponse)
          resolve()
        }, 100)
      })
    })
  })

  describe('sessionExpired()', () => {
    test('success', async () => {
      await store.dispatch(User.sessionExpired())

      expect(store.getActions()).toEqual([
        { type: UserActions.SessionExpired.type },
      ])
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      store = mockStore({
        ...initialState,
        user: {
          ...userInitialState,
          isSessionExpired: true,
        },
      }) as any

      await store.dispatch(User.serialize() as any)

      expect(sessionStorage.setItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('isSessionExpired', 'true')

      expect(store.getActions()).toEqual([
        { type: UserActions.Serialized.type },
      ])
    })
  })

  describe('deserialize()', () => {
    test('success', async () => {
      // Mock local storage.
      sessionStorage.setItem('isSessionExpired', 'true')

      await store.dispatch(User.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('isSessionExpired')

      expect(store.getActions()).toEqual([
        {
          type: UserActions.Deserialized.type,
          payload: {
            isSessionExpired: true,
          },
        },
      ])
    })

    test('no saved data', async () => {
      await store.dispatch(User.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('isSessionExpired')

      expect(store.getActions()).toEqual([
        {
          type: UserActions.Deserialized.type,
          payload: {
            isSessionExpired: userInitialState.isSessionExpired,
          },
        }
      ])
    })

    test('invalid saved data', async () => {
      // Mock local storage.
      sessionStorage.setItem('isSessionExpired', 'badJson')

      await store.dispatch(User.deserialize())

      // Deserialize should gracefully handle errors.
      expect(sessionStorage.getItem).toHaveBeenCalledTimes(1)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('isSessionExpired')

      expect(store.getActions()).toEqual([
        {
          type: UserActions.Deserialized.type,
          payload: {
            isSessionExpired: userInitialState.isSessionExpired,
          },
        },
      ])
    })
  })
})
