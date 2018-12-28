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
import {ALGORITHM_ENDPOINT} from '../config'
import {getClient} from '../api/session'
import {AppState} from '../store'
import {algorithmsInitialState, AlgorithmsState} from '../reducers/algorithmsReducer'

export namespace Algorithms {
  export function fetch() {
    return async (dispatch: Dispatch<AlgorithmsState>) => {
      dispatch({...new AlgorithmsActions.Fetching()})

      try {
        const response = await getClient().get(ALGORITHM_ENDPOINT) as FetchResponse
        dispatch({...new AlgorithmsActions.FetchSuccess({
          records: response.data.algorithms.map(record => ({
            description: record.description,
            id: record.service_id,
            maxCloudCover: record.max_cloud_cover,
            name: record.name,
            type: record.interface,
          })),
        })})
      } catch (error) {
        dispatch({...new AlgorithmsActions.FetchError({ error })})
      }
    }
  }

  export function serialize() {
    return (dispatch: Dispatch<AlgorithmsState>, getState: () => AppState) => {
      const state = getState()

      sessionStorage.setItem('algorithms_records', JSON.stringify(state.algorithms.records))

      dispatch({...new AlgorithmsActions.Serialized()})
    }
  }

  export function deserialize() {
    let records: beachfront.Algorithm[] | null = null
    try {
      records = JSON.parse(sessionStorage.getItem('algorithms_records') || 'null')
    } catch (error) {
      console.warn('Failed to deserialize "algorithms_records"')
    }

    return {...new AlgorithmsActions.Deserialized({
      records: records || algorithmsInitialState.records,
    })}
  }
}

export namespace AlgorithmsActions {
  export class Fetching implements Action {
    static type = 'ALGORITHMS_FETCHING'
    type = Fetching.type
  }

  export class FetchSuccess implements Action {
    static type = 'ALGORITHMS_FETCH_SUCCESS'
    type = FetchSuccess.type
    constructor(public payload: {
      records: typeof algorithmsInitialState.records
    }) {}
  }

  export class FetchError implements Action {
    static type = 'ALGORITHMS_FETCH_ERROR'
    type = FetchError.type
    constructor(public payload: {
      error: typeof algorithmsInitialState.fetchError
    }) {}
  }

  export class Serialized implements Action {
    static type = 'ALGORITHMS_SERIALIZED'
    type = Serialized.type
  }

  export class Deserialized implements Action {
    static type = 'ALGORITHMS_DESERIALIZED'
    type = Deserialized.type
    constructor(public payload: {
      records: typeof algorithmsInitialState.records
    }) {}
  }
}

interface FetchResponse {
  data: {
    algorithms: Array<{
      description: string
      service_id: string
      max_cloud_cover: number
      name: string
      interface: string
    }>
  }
}
