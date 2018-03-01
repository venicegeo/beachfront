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
import * as moment from 'moment'
import {Dropdown} from './Dropdown'
import {FileDownloadLink} from './FileDownloadLink'
import {LoadingAnimation} from './LoadingAnimation'
import {normalizeSceneId} from './SceneFeatureDetails'
import {JOB_ENDPOINT} from '../config'

interface Props {
  className?: string
  duration: string
  durations: {value: string, label: string}[]
  error?: any
  isLoading: boolean
  jobs: beachfront.Job[]
  selectedJobIds: string[]
  onDurationChange(value: string)
  onHoverIn(job: beachfront.Job)
  onHoverOut(job: beachfront.Job)
  onRowClick(job: beachfront.Job)
}

export const ActivityTable = ({
  className,
  duration,
  durations,
  isLoading,
  jobs,
  selectedJobIds,
  onDurationChange,
  onHoverIn,
  onHoverOut,
  onRowClick,
}: Props) => (
  <div className={`${styles.root} ${isLoading ? styles.isLoading : ''} ${className}`}>

    <div className={styles.filter}>
      Activity:
      <Dropdown
        className={styles.filterDropdown}
        options={durations}
        value={duration}
        onChange={onDurationChange}
      />
    </div>

    <div className={styles.shadowTop}/>
    <div className={styles.tableContainer}>
      <table>
        <thead>
          <tr>
            <th>Scene ID</th>
            <th>Captured On</th>
            <th>Sensor</th>
            <td></td>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <tr
              key={job.id}
              className={selectedJobIds.includes(job.id) ? styles.isActive : ''}
              onClick={() => onRowClick(job)}
              onMouseEnter={() => onHoverIn(job)}
              onMouseLeave={() => onHoverOut(job)}
              >
              <td>{getSceneId(job)}</td>
              <td>{getCapturedOn(job)}</td>
              <td>{getImageSensor(job)}</td>
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
          {isLoading && generatePlaceholderRows(10)}
        </tbody>
      </table>
    </div>
    <div className={styles.shadowBottom}/>
    {isLoading && (
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

function getCapturedOn({ properties }: beachfront.Job) {
  const then = moment(properties.scene_time_of_collect)
  return then.format(then.year() === new Date().getFullYear() ? 'MM/DD' : 'MM/DD/YYYY')
}

function getSceneId({ properties }: beachfront.Job) {
  return normalizeSceneId(properties.scene_id)
}

function getImageSensor({ properties }: beachfront.Job) {
  return properties.scene_sensor_name
}
