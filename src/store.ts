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
import reduxLogger from 'redux-logger'
import {userInitialState, userReducer, UserState} from './reducers/userReducer'
import {catalogInitialState, catalogReducer, CatalogState} from './reducers/catalogReducer'
import {routeInitialState, routeReducer, RouteState} from './reducers/routeReducer'
import {mapInitialState, mapReducer, MapState} from './reducers/mapReducer'
import {jobsInitialState, jobsReducer, JobsState} from './reducers/jobsReducer'
import {productLinesInitialState, productLinesReducer, ProductLinesState} from './reducers/productLinesReducer'
import {
  enabledPlatformsInitialState,
  enabledPlatformsReducer,
  EnabledPlatformsState,
} from './reducers/enabledPlatformsReducer'

const middleware = [reduxThunk]

if (process.env.NODE_ENV !== 'production') {
  middleware.push(reduxLogger)
}

export interface AppState {
  user: UserState
  catalog: CatalogState
  route: RouteState
  map: MapState
  jobs: JobsState
  productLines: ProductLinesState
  enabledPlatforms: EnabledPlatformsState,
}

const initialState: AppState = {
  user: userInitialState,
  catalog: catalogInitialState,
  route: routeInitialState,
  map: mapInitialState,
  jobs: jobsInitialState,
  productLines: productLinesInitialState,
  enabledPlatforms: enabledPlatformsInitialState,
}

export default createStore(
  combineReducers({
    user: userReducer,
    catalog: catalogReducer,
    route: routeReducer,
    map: mapReducer,
    jobs: jobsReducer,
    productLines: productLinesReducer,
    enabledPlatforms: enabledPlatformsReducer,
  }),
  initialState,
  applyMiddleware(...middleware),
)
