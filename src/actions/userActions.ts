/**
 * Copyright 2016, RadiantBlue Technologies, Inc.
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

import * as sessionService from '../api/session'
import {UserState} from '../reducers/userReducer'

export const types = {
  USER_LOGGING_IN: 'USER_LOGGING_IN',
  USER_LOGGED_IN: 'USER_LOGGED_IN',
  USER_LOGGED_OUT: 'USER_LOGGED_OUT',
  USER_SESSION_CLEARED: 'USER_SESSION_CLEARED',
  USER_SESSION_LOGGED_OUT: 'USER_SESSION_LOGGED_OUT',
  USER_SESSION_EXPIRED: 'USER_SESSION_EXPIRED',
  USER_SERIALIZED: 'USER_SERIALIZED',
}

export const userActions = {
  login(args) {
    // TODO: Is this necessary? It seems like we're logging in via cookies or something with GeoAxis...
    return dispatch => {
      dispatch({ type: types.USER_LOGGING_IN })
    }
  },

  logout() {
    return { type: types.USER_LOGGED_OUT }
  },

  clearSession() {
    sessionStorage.clear()
    return { type: types.USER_SESSION_CLEARED }
  },

  sessionLogout() {
    sessionStorage.clear()
    const client = sessionService.getClient()
    client.get(`/oauth/logout`).then(response => {
      window.location.href = response.data
    })

    return { type: types.USER_SESSION_LOGGED_OUT }
  },

  sessionExpired() {
    return { type: types.USER_SESSION_EXPIRED }
  },

  serialize() {
    // TODO: Figure out a better way to do this more natural to Redux.
    return (dispatch, getState) => {
      const user: UserState = getState().user
      sessionStorage.setItem('isSessionExpired', JSON.stringify(user.isSessionExpired))
      dispatch({ type: types.USER_SERIALIZED })
    }
  },
}
