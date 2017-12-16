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

const styles: any = require('./JobStatus.css')

import * as React from 'react'
import * as moment from 'moment'
import {Link} from './Link'
import {Timestamp} from './Timestamp'
import {JobDownload} from './JobDownload'

import {
  STATUS_SUCCESS,
  STATUS_RUNNING,
  STATUS_ERROR,
  STATUS_TIMED_OUT,
  STATUS_CANCELLED,
} from '../constants'

interface Props {
  className?: string
  isActive: boolean
  job: beachfront.Job
  onForgetJob(jobId: string)
  onNavigate(loc: { pathname: string, search: string, hash: string })
}

interface State {
  downloadProgress?: number
  isControlHover?: boolean
  isDownloading?: boolean
  isExpanded?: boolean
  isRemoving?: boolean
}

export class JobStatus extends React.Component<Props, State> {
  constructor() {
    super()

    this.state = {
      downloadProgress: 0,
      isControlHover: false,
      isDownloading: false,
      isExpanded: false,
      isRemoving: false,
    }

    this.emitOnForgetJob        = this.emitOnForgetJob.bind(this)
    this.handleDownloadComplete = this.handleDownloadComplete.bind(this)
    this.handleDownloadError    = this.handleDownloadError.bind(this)
    this.handleDownloadProgress = this.handleDownloadProgress.bind(this)
    this.handleDownloadStart    = this.handleDownloadStart.bind(this)
    this.handleExpansionToggle  = this.handleExpansionToggle.bind(this)
    this.handleForgetToggle     = this.handleForgetToggle.bind(this)
  }

  render() {
    const { id, properties } = this.props.job
    const downloadPercentage = `${this.state.downloadProgress || 0}%`

    return (
      <li className={`${styles.root} ${this.aggregatedClassNames}`}>
        <div className={styles.details} onClick={this.handleExpansionToggle}>
          <h3 className={styles.title}>
            <i className={`fa fa-chevron-right ${styles.caret}`}/>
            <span>{segmentIfNeeded(properties.name)}</span>
          </h3>

          <div className={styles.summary}>
            <span className={styles.status}>{properties.status}</span>
            <Timestamp
              className={styles.timer}
              timestamp={properties.created_on}
            />
          </div>

          <div className={styles.progressBar} title={downloadPercentage}>
            <div className={styles.puck} style={{width: downloadPercentage}}/>
          </div>

          <div className={styles.metadata} onClick={e => e.stopPropagation()}>
            <dl>
              <dt>Algorithm</dt>
              <dd>{properties.algorithm_name}</dd>
              <dt>Scene ID</dt>
              <dd>{normalizeSceneId(properties.scene_id)}</dd>
              <dt>Captured On</dt>
              <dd>{moment(properties.scene_time_of_collect).utc().format('MM/DD/YYYY HH:mm z')}</dd>
              <dt>Sensor</dt>
              <dd>{properties.scene_sensor_name}</dd>
            </dl>
            <div className={styles.removeToggle}>
              <button onClick={this.handleForgetToggle}>
                Remove this Job
              </button>
            </div>
            <div className={styles.removeWarning}>
              <h4>
                <i className="fa fa-warning"/> Are you sure you want to remove this job from your list?
              </h4>
              <button onClick={this.emitOnForgetJob}>Remove this Job</button>
              <button onClick={this.handleForgetToggle}>Cancel</button>
            </div>
          </div>
        </div>

        <div
          className={styles.controls}
          onMouseEnter={() => this.setState({ isControlHover: true })}
          onMouseLeave={() => this.setState({ isControlHover: false })}
        >
          <Link
            pathname="/"
            search={`?jobId=${id}`}
            title="View on Map"
            onClick={this.props.onNavigate}>
            <i className="fa fa-globe"/>
          </Link>
          {properties.status === STATUS_SUCCESS && (
            <JobDownload
              basename={properties.name}
              className={styles.download}
              isHover={this.state.isControlHover}
              jobId={id}
              onComplete={this.handleDownloadComplete}
              onError={this.handleDownloadError}
              onProgress={this.handleDownloadProgress}
              onStart={this.handleDownloadStart}
            />
          )}
        </div>
      </li>
    )
  }

  //
  // Internals
  //

  private get aggregatedClassNames() {
    return [
      this.classForActive,
      this.classForDownloading,
      this.classForExpansion,
      this.classForLoading,
      this.classForRemoving,
      this._classForStatus,
    ].filter(Boolean).join(' ')
  }

  private get classForActive() {
    return this.props.isActive ? styles.isActive : ''
  }

  private get classForDownloading() {
    return this.state.isDownloading ? styles.isDownloading : ''
  }

  private get classForExpansion() {
    return this.state.isExpanded ? styles.isExpanded : ''
  }

  private get classForLoading() {
    return this.state.isDownloading ? styles.isLoading : ''
  }

  private get classForRemoving() {
    return this.state.isRemoving ? styles.isRemoving : ''
  }

  private get _classForStatus() {
    switch (this.props.job.properties.status) {
      case STATUS_SUCCESS: return styles.succeeded
      case STATUS_RUNNING: return styles.running
      case STATUS_TIMED_OUT: return styles.timedOut
      case STATUS_ERROR: return styles.failed
      case STATUS_CANCELLED: return styles.cancelled
      default: return ''
    }
  }

  private emitOnForgetJob() {
    this.props.onForgetJob(this.props.job.id)
  }

  private handleDownloadProgress(loadedBytes, totalBytes) {
    this.setState({ downloadProgress: Math.floor(100 * loadedBytes / totalBytes) })
  }

  private handleDownloadStart() {
    this.setState({ isDownloading: true })
  }

  private handleDownloadComplete() {
    this.setState({ isDownloading: false })
  }

  private handleDownloadError(err) {
    this.setState({ isDownloading: false })
    console.error(`Download failed: ${err.stack}`)
  }

  private handleExpansionToggle() {
    this.setState({
      isExpanded: !this.state.isExpanded,
      isRemoving: false,
    })
  }

  private handleForgetToggle() {
    this.setState({ isRemoving: !this.state.isRemoving })
  }
}

//
// Helpers
//

function normalizeSceneId(sceneId) {
  return sceneId.replace(/^(rapideye|planetscope|landsat|sentinel):/, '')
}

function segmentIfNeeded(s: string) {
  return s.length > 30 ? s.replace(/(\W)/g, '$1 ') : s
}
