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

import {applyMiddleware, combineReducers, createStore} from 'redux'
import reduxThunk from 'redux-thunk'
import {UserReducer} from './reducers/userReducer'
import {CatalogReducer} from './reducers/catalogReducer'
import {RouteReducer} from './reducers/routeReducer'

const initialState = {
  user: UserReducer.initialState,
  catalog: CatalogReducer.initialState,
  route: RouteReducer.initialState,
}

export default createStore(
  combineReducers({
    user: UserReducer.reduce,
    catalog: CatalogReducer.reduce,
    route: RouteReducer.reduce,
  }),
  initialState,  // TODO: Deserialize here.
  applyMiddleware(reduxThunk),
)
