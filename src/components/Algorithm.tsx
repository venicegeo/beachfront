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

const styles: any = require('./Algorithm.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {AppState} from '../store'

type StateProps = ReturnType<typeof mapStateToProps>
type PassedProps = {
  algorithm: beachfront.Algorithm
  sceneMetadata: beachfront.SceneMetadata
  isSelected?: boolean
  warningHeading?: string
  warningMessage?: string
  errorElement?: React.ReactElement<any>
  onSelect?: (algorithm: beachfront.Algorithm) => void
  onSubmit?: (algorithm: beachfront.Algorithm) => void
}
type Props = StateProps & PassedProps

export const Algorithm = (props: Props) => (
  <div className={[
    styles.root,
    props.jobs.isCreatingJob ? styles.isSubmitting : '',
    meetsCloudCoverRequirement(props.algorithm, props.sceneMetadata) ? styles.isCompatible : styles.isNotCompatible,
    props.isSelected ? styles.isSelected : '',
    props.onSelect ? styles.isSelectable : '',
  ].join(' ')}>
    <section className={styles.header} onClick={props.onSelect && (() => !props.isSelected && props.onSelect && props.onSelect(props.algorithm))}>
      {props.onSelect && (
        <span className={styles.selectionIndicator}>
          <input
            type="radio"
            readOnly={true}
            checked={props.isSelected}
          />
        </span>
      )}
      <span className={styles.name}>
        <span>{props.algorithm.name}</span>
      </span>
      <span className={styles.warningIndicator}>
        <i className="fa fa-warning"/>
      </span>
    </section>

    {props.errorElement}

    <section className={styles.details}>
      <div className={styles.description}>{props.algorithm.description}</div>

      <div className={styles.controls}>
        <div className={styles.compatibilityWarning}>
          <h4><i className="fa fa-warning"/> {props.warningHeading || 'Incompatible Image Selected'}</h4>
          <p>{props.warningMessage || "The image you've selected does not meet all of this algorithm's requirements.  You can run it anyway but it may not produce the expected results."}</p>
        </div>

        {props.onSubmit && (
          <button
            className={styles.startButton}
            disabled={props.jobs.isCreatingJob}
            onClick={() => {
              return props.onSubmit && props.onSubmit(props.algorithm)
            }}
            >
            {props.jobs.isCreatingJob ? 'Starting' : 'Run Algorithm'}
          </button>
        )}
      </div>

      <div className={styles.requirements}>
        <h4>Image Requirements</h4>
        <table>
          <tbody>
            <tr className={meetsCloudCoverRequirement(props.algorithm, props.sceneMetadata) ? styles.met : styles.unmet}>
              <th>Maximum Cloud Cover</th>
              <td>Less than or equal to {props.algorithm.maxCloudCover}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
)

//
// Helpers
//

function meetsCloudCoverRequirement(algorithm: beachfront.Algorithm, metadata: beachfront.SceneMetadata) {
  return algorithm.maxCloudCover >= metadata.cloudCover
}

function mapStateToProps(state: AppState) {
  return {
    jobs: state.jobs,
  }
}

export default connect<StateProps, undefined, PassedProps>(
  mapStateToProps,
)(Algorithm)
