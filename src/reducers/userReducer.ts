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
import {UserActions as Actions} from '../actions/userActions'
import * as session from '../api/session'

export interface UserState {
  isLoggedIn: boolean
  isSessionExpired: boolean
  isSessionLoggedOut: boolean
  catalogApiKey: string
}

export const userInitialState: UserState = {
  isLoggedIn: session.initialize(),
  isSessionExpired: false,
  isSessionLoggedOut: false,
  catalogApiKey: '',
}

export function userReducer(state = userInitialState, action: Action): UserState {
  switch (action.type) {
    case Actions.LoggedOut.type:
      return {
        ...state,
        isLoggedIn: false,
        isSessionLoggedOut: true,
      }
    case Actions.SessionCleared.type:
      return {
        ...state,
        isLoggedIn: false,
        isSessionExpired: false,
      }
    case Actions.SessionLoggedOut.type:
      return {
        ...state,
        isLoggedIn: false,
        isSessionLoggedOut: false,
      }
    case Actions.SessionExpired.type:
      return {
        ...state,
        isSessionExpired: true,
      }
    case Actions.Deserialized.type: {
      const payload = (action as Actions.Deserialized).payload
      return {
        ...state,
        isSessionExpired: payload.isSessionExpired,
      }
    }
    default:
      return state
  }
}
