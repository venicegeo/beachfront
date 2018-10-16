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

const styles: any = require('./AlgorithmList.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {Algorithm} from './Algorithm'
import {AppState} from '../store'
import {JobsState} from '../reducers/jobsReducer'

interface Props {
  jobs?: JobsState
  algorithms: beachfront.Algorithm[]
  sceneMetadata: beachfront.SceneMetadata
  selectedId?: string
  warningHeading?: string
  warningMessage?: string
  onSelect?(algorithm: beachfront.Algorithm)
  onSubmit?(algorithm: beachfront.Algorithm)
}

export const AlgorithmList = (props: Props) => (
  <div className={styles.root}>
    <h2>Select Algorithm</h2>
    <ul>
      {props.algorithms.map(algorithm => (
        <li key={algorithm.id}>
          <Algorithm
            algorithm={algorithm}
            sceneMetadata={props.sceneMetadata}
            isSelected={props.selectedId === algorithm.id}
            warningHeading={props.warningHeading}
            warningMessage={props.warningMessage}
            onSelect={props.onSelect}
            onSubmit={props.onSubmit}
            errorElement={props.jobs.createJobError && (
            <div className={styles.errorMessage}>
              <h4><i className="fa fa-warning"/> Algorithm failed</h4>
              <p>{props.jobs.createJobError.response.data}</p>
              <pre>{props.jobs.createJobError.stack}</pre>
            </div>
          )}
          />
        </li>
      ))}
    </ul>
  </div>
)

function mapStateToProps(state: AppState) {
  return {
    jobs: state.jobs,
  }
}

export default connect(
  mapStateToProps,
  undefined,
)(AlgorithmList)
