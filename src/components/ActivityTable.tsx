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

const styles = require('./ActivityTable.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {Dropdown} from './Dropdown'
import {FileDownloadLink} from './FileDownloadLink'
import {LoadingAnimation} from './LoadingAnimation'
import {normalizeSceneId} from './SceneFeatureDetails'
import {JOB_ENDPOINT} from '../config'
import {AppState} from '../store'
import {mapActions} from '../actions/mapActions'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type PassedProps = {
  className?: string
  duration: string
  durations: {value: string, label: string}[]
  selectedJobIds: string[]
  onDurationChange(value: string)
  onRowClick(job: beachfront.Job)
}
type Props = StateProps & DispatchProps & PassedProps

export const ActivityTable = (props: Props) => (
  <div className={`${styles.root} ${props.productLines.isFetchingJobs ? styles.isLoading : ''} ${props.className}`}>

    <div className={styles.filter}>
      Activity:
      <Dropdown
        className={styles.filterDropdown}
        options={props.durations}
        value={props.duration}
        onChange={props.onDurationChange}
      />
    </div>

    <div className={styles.shadowTop}/>
    <div className={styles.tableContainer}>
      <table>
        <thead>
        <tr>
          <th>Scene ID</th>
          {/*<th>Captured On</th>
        <th>Sensor</th>*/}
          <td></td>
        </tr>
        </thead>
        <tbody>
        {props.productLines.jobs.map(job => (
          <tr
            key={job.id}
            className={props.selectedJobIds.includes(job.id) ? styles.isActive : ''}
            onClick={() => props.onRowClick(job)}
            onMouseEnter={() => props.actions.map.setHoveredFeature(job)}
            onMouseLeave={() => props.actions.map.setHoveredFeature(null)}
          >
            <td>{getSceneId(job)}</td>
            {/*<td>{getCapturedOn(job)}</td>
          <td>{getImageSensor(job)}</td>*/}
            <td className={styles.downloadCell} onClick={e => e.stopPropagation()}>
              <FileDownloadLink
                className={styles.downloadButton}
                filename={job.properties.name + '.geojson'}
                jobId={job.id}
                apiUrl={JOB_ENDPOINT + '/' + job.id + '.geojson'}
                displayText="Download GeoJSON"
                onComplete={() => console.log('onComplete')}
                onError={() => console.log('onError')}
                onProgress={() => console.log('onProgress')}
                onStart={() => console.log('onStart')}
              />
            </td>
          </tr>
        ))}
        {props.productLines.isFetchingJobs && generatePlaceholderRows(10)}
        </tbody>
      </table>
    </div>
    <div className={styles.shadowBottom}/>
    {props.productLines.isFetchingJobs && (
      <div className={styles.loadingMask}>
        <LoadingAnimation className={styles.loadingAnimation}/>
      </div>
    )}
  </div>
)

//
// Helpers
//

function generatePlaceholderRows(count) {
  const rows = []
  for (let i = 0; i < count; i++) {
    rows.push(
      <tr key={i} className={styles.placeholder}>
        <td><span/></td>
        <td><span/></td>
        <td><span/></td>
        <td><span/></td>
      </tr>,
    )
  }
  return rows
}

/*function getCapturedOn({ properties }: beachfront.Job) {
  const then = moment(properties.captured_on)
  return then.format(then.year() === new Date().getFullYear() ? 'MM/DD' : 'MM/DD/YYYY')
}*/

function getSceneId({ properties }: beachfront.Job) {
  return normalizeSceneId(properties.scene_id)
}

/*function getImageSensor({ properties }: beachfront.Job) {
  return properties.scene_sensor_name
}*/

function mapStateToProps(state: AppState) {
  return {
    productLines: state.productLines,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      map: {
        setHoveredFeature: (hoveredFeature: beachfront.Job | null) => (
          dispatch(mapActions.setHoveredFeature(hoveredFeature))
        ),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(ActivityTable)
