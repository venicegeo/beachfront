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
import {createLogger} from 'redux-logger'
import {userInitialState, userReducer, UserState} from './reducers/userReducer'
import {catalogInitialState, catalogReducer, CatalogState} from './reducers/catalogReducer'
import {routeInitialState, routeReducer, RouteState} from './reducers/routeReducer'
import {mapInitialState, mapReducer, MapState} from './reducers/mapReducer'
import {jobsInitialState, jobsReducer, JobsState} from './reducers/jobsReducer'
import {productLinesInitialState, productLinesReducer, ProductLinesState} from './reducers/productLinesReducer'
import {algorithmsInitialState, algorithmsReducer, AlgorithmsState} from './reducers/algorithmsReducer'
import {apiStatusInitialState, apiStatusReducer, ApiStatusState} from './reducers/apiStatusReducer'
import {tourInitialState, tourReducer, TourState} from './reducers/tourReducer'

const middleware = [reduxThunk]

if (process.env.NODE_ENV === 'development') {
  middleware.push(createLogger({
    predicate: (_: any, action: any) => !action.type.includes('SERIALIZED'),
    collapsed: true,
  }))
}

export interface AppState {
  user: UserState
  catalog: CatalogState
  route: RouteState
  map: MapState
  jobs: JobsState
  productLines: ProductLinesState
  algorithms: AlgorithmsState
  apiStatus: ApiStatusState
  tour: TourState
}

export const initialState: AppState = {
  user: userInitialState,
  catalog: catalogInitialState,
  route: routeInitialState,
  map: mapInitialState,
  jobs: jobsInitialState,
  productLines: productLinesInitialState,
  algorithms: algorithmsInitialState,
  apiStatus: apiStatusInitialState,
  tour: tourInitialState,
}

export default createStore(
  combineReducers({
    user: userReducer,
    catalog: catalogReducer,
    route: routeReducer,
    map: mapReducer,
    jobs: jobsReducer,
    productLines: productLinesReducer,
    algorithms: algorithmsReducer,
    apiStatus: apiStatusReducer,
    tour: tourReducer,
  }),
  initialState,
  applyMiddleware(...middleware),
)
