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

import {userInitialState, userReducer} from '../../src/reducers/userReducer'
import {userTypes} from '../../src/actions/userActions'

describe('userReducer', () => {
  test('initialState', () => {
    expect(userReducer(undefined, {})).toEqual(userInitialState)
  })

  test('USER_DESERIALIZED', () => {
    const action = {
      type: userTypes.USER_DESERIALIZED,
      deserialized: {
        a: 'a',
      },
    }

    expect(userReducer(userInitialState, action)).toEqual({
      ...userInitialState,
      ...action.deserialized,
    })
  })

  test('USER_LOGGED_OUT', () => {
    const state = {
      ...userInitialState,
      isLoggedIn: true,
    }

    const action = { type: userTypes.USER_LOGGED_OUT }

    expect(userReducer(state, action)).toEqual({
      ...state,
      isLoggedIn: false,
      isSessionLoggedOut: true,
    })
  })

  test('USER_SESSION_CLEARED', () => {
    const state = {
      ...userInitialState,
      isLoggedIn: true,
      isSessionExpired: true,
    }

    const action = { type: userTypes.USER_SESSION_CLEARED }

    expect(userReducer(state, action)).toEqual({
      ...state,
      isLoggedIn: false,
      isSessionExpired: false,
    })
  })

  test('USER_SESSION_LOGGED_OUT', () => {
    const state = {
      ...userInitialState,
      isLoggedIn: true,
      isSessionLoggedOut: true,
    }

    const action = { type: userTypes.USER_SESSION_LOGGED_OUT }

    expect(userReducer(state, action)).toEqual({
      ...state,
      isLoggedIn: false,
      isSessionLoggedOut: false,
    })
  })

  test('USER_SESSION_EXPIRED', () => {
    const action = { type: userTypes.USER_SESSION_EXPIRED }

    expect(userReducer(userInitialState, action)).toEqual({
      ...userInitialState,
      isSessionExpired: true,
    })
  })
})
