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
import {getClient} from '../api/session'
import {AppState} from '../store'
import {userInitialState, UserState} from '../reducers/userReducer'

export namespace User {
  export function logout() {
    return {...new UserActions.LoggedOut()}
  }

  export function clearSession() {
    sessionStorage.clear()
    return {...new UserActions.SessionCleared()}
  }

  export function sessionLogout() {
    sessionStorage.clear()

    getClient().get(`/oauth/logout`).then(response => {
      window.location.href = response.data
    })

    return {...new UserActions.SessionLoggedOut()}
  }

  export function sessionExpired() {
    return {...new UserActions.SessionExpired()}
  }

  export function serialize() {
    return (dispatch: Dispatch<UserState>, getState: () => AppState) => {
      const state = getState()

      sessionStorage.setItem('isSessionExpired', JSON.stringify(state.user.isSessionExpired))

      dispatch({...new UserActions.Serialized()})
    }
  }

  export function deserialize() {
    let isSessionExpired: boolean | null = null
    try {
      isSessionExpired = JSON.parse(sessionStorage.getItem('isSessionExpired') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "isSessionExpired"')
    }

    return {...new UserActions.Deserialized({
      isSessionExpired: (isSessionExpired != null) ? isSessionExpired : userInitialState.isSessionExpired,
    })}
  }
}

export namespace UserActions {
  export class LoggedOut implements Action {
    static type = 'USER_LOGGED_OUT'
    type = LoggedOut.type
  }

  export class SessionCleared implements Action {
    static type = 'USER_SESSION_CLEARED'
    type = SessionCleared.type
  }

  export class SessionLoggedOut implements Action {
    static type = 'USER_SESSION_LOGGED_OUT'
    type = SessionLoggedOut.type
  }

  export class SessionExpired implements Action {
    static type = 'USER_SESSION_EXPIRED'
    type = SessionExpired.type
  }

  export class Serialized implements Action {
    static type = 'USER_SERIALIZED'
    type = Serialized.type
  }

  export class Deserialized implements Action {
    static type = 'USER_DESERIALIZED'
    type = Deserialized.type
    constructor(public payload: {
      isSessionExpired: typeof userInitialState.isSessionExpired
    }) {}
  }
}
