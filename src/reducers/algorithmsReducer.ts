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

import {algorithmsTypes} from '../actions/algorithmsActions'

export interface AlgorithmsState {
  records: beachfront.Algorithm[]
  isFetching: boolean
  fetchError: any
}

export const algorithmsInitialState: AlgorithmsState = {
  records: [],
  isFetching: false,
  fetchError: null,
}

export function algorithmsReducer(state = algorithmsInitialState, action: any) {
  switch (action.type) {
    case algorithmsTypes.ALGORITHMS_DESERIALIZED:
      return {
        ...state,
        ...action.deserialized,
      }
    case algorithmsTypes.ALGORITHMS_FETCHING:
      return {
        ...state,
        isFetching: true,
        fetchError: null,
      }
    case algorithmsTypes.ALGORITHMS_FETCH_SUCCESS:
      return {
        ...state,
        isFetching: false,
        records: action.records,
      }
    case algorithmsTypes.ALGORITHMS_FETCH_ERROR:
      return {
        ...state,
        isFetching: false,
        fetchError: action.error,
      }
    default:
      return state
  }
}
