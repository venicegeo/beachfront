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

import {ALGORITHM_ENDPOINT} from '../config'
import {getClient} from '../api/session'
import {AppState} from '../store'
import {algorithmsInitialState} from '../reducers/algorithmsReducer'

export const algorithmsTypes = {
  ALGORITHMS_FETCHING: 'ALGORITHMS_FETCHING',
  ALGORITHMS_FETCH_SUCCESS: 'ALGORITHMS_FETCH_SUCCESS',
  ALGORITHMS_FETCH_ERROR: 'ALGORITHMS_FETCH_ERROR',
  ALGORITHMS_SERIALIZED: 'ALGORITHMS_SERIALIZED',
  ALGORITHMS_DESERIALIZED: 'ALGORITHMS_DESERIALIZED',
}

export const algorithmsActions = {
  fetch() {
    return async dispatch => {
      dispatch({ type: algorithmsTypes.ALGORITHMS_FETCHING })

      try {
        const response = await getClient().get(ALGORITHM_ENDPOINT)
        dispatch({
          type: algorithmsTypes.ALGORITHMS_FETCH_SUCCESS,
          records: response.data.algorithms.map(record => ({
            description: record.description,
            id: record.service_id,
            maxCloudCover: record.max_cloud_cover,
            name: record.name,
            type: record.interface,
          })),
        })
      } catch (error) {
        dispatch({
          type: algorithmsTypes.ALGORITHMS_FETCH_ERROR,
          error: (error.response) ? error.response.data : error,
        })
      }
    }
  },

  serialize() {
    return (dispatch, getState) => {
      const state: AppState = getState()

      sessionStorage.setItem('algorithms_records', JSON.stringify(state.algorithms.records))

      dispatch({ type: algorithmsTypes.ALGORITHMS_SERIALIZED })
    }
  },

  deserialize() {
    const deserialized: any = {}

    try {
      deserialized.records = JSON.parse(sessionStorage.getItem('algorithms_records')) || algorithmsInitialState.records
    } catch (error) {
      console.warn('Failed to deserialize "algorithms_records"')
    }

    return {
      type: algorithmsTypes.ALGORITHMS_DESERIALIZED,
      deserialized,
    }
  },
}
