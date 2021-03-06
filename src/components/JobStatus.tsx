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
import {normalizeSceneId} from './SceneFeatureDetails'

import {
  STATUS_SUCCESS,
  STATUS_RUNNING,
  STATUS_ERROR,
  STATUS_TIMED_OUT,
  STATUS_CANCELLED,
  STATUS_ACTIVATING,
  STATUS_PENDING,
  STATUS_SUBMITTED,
  STATUS_FAIL,
} from '../constants'
import {connect} from 'react-redux'
import {Map} from '../actions/mapActions'
import {Jobs} from '../actions/jobsActions'
import {AppState} from '../store'
import {Extent, featureToExtentWrapped} from '../utils/geometries'
import {Route, RouteNavigateToArgs} from '../actions/routeActions'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type PassedProps = {
  isActive: boolean
  job: beachfront.Job
  className?: string
  onToggleExpansion: (job: beachfront.Job, isExpanded: boolean) => void
}
type Props = StateProps & DispatchProps & PassedProps

interface State {
  downloadProgress: number
  isControlHover: boolean
  isDownloading: boolean
  isExpanded: boolean
  isRemoving: boolean
}

export class JobStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      downloadProgress: NaN,
      isControlHover: false,
      isDownloading: false,
      isExpanded: false,
      isRemoving: false,
    }

    this.jobTitleClick = this.jobTitleClick.bind(this)
    this.handleDownloadComplete = this.handleDownloadComplete.bind(this)
    this.handleDownloadError = this.handleDownloadError.bind(this)
    this.handleDownloadProgress = this.handleDownloadProgress.bind(this)
    this.handleDownloadStart = this.handleDownloadStart.bind(this)
    this.handleRemoveJob = this.handleRemoveJob.bind(this)
    this.handleRemoveJobConfirm = this.handleRemoveJobConfirm.bind(this)
    this.handleViewOnMapClick = this.handleViewOnMapClick.bind(this)
    this.toggleExpansion = this.toggleExpansion.bind(this)
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    return ((this.props.isActive !== nextProps.isActive) ||
      (this.props.className !== nextProps.className) ||
      (this.props.job.properties.status !== nextProps.job.properties.status) ||
      (this.state.isExpanded !== nextState.isExpanded) ||
      (this.state.isDownloading !== nextState.isDownloading) ||
      (this.state.isControlHover !== nextState.isControlHover) ||
      (this.state.isRemoving !== nextState.isRemoving))
  }

  render() {
    const { id, properties } = this.props.job
    const hasError = !!properties.errorDetails
    const timeOfCollect = moment.utc(properties.time_of_collect).local().format('llll')

    return (
      <li className={`${styles.root} ${this.aggregatedClassNames} ${this.activeJobId}`}>
        <div
          className={styles.progressBar}
          title={`${isNaN(this.state.downloadProgress) ? '—' : this.state.downloadProgress}%`}
        >
          <div
            className={styles.puck}
            style={{ width: `${this.state.downloadProgress || 0}%` }}
          />
        </div>

        <div className={styles.wrapper}>
          <div className={styles.details}>
            <h3 className={styles.title}>
              <i
                className={`fa fa-chevron-right ${styles.caret}`}
                onClick={this.toggleExpansion}
              />
              <span onClick={this.jobTitleClick}>
                {segmentIfNeeded(properties.name)}
              </span>
            </h3>

            <div className={styles.summary}>
              <span className={styles.status}>{properties.status}</span>
              <Timestamp
                className={styles.timer}
                timestamp={properties.created_on}
              />
            </div>

            <div className={styles.metadata} onClick={e => e.stopPropagation()}>
              <dl>
                <dt>Algorithm</dt>
                <dd>{properties.algorithm_name}</dd>
                <dt>Scene ID</dt>
                <dd>{normalizeSceneId(properties.scene_id)}</dd>
                <dt>Captured</dt>
                <dd>{timeOfCollect}</dd>
                {hasError && (<dt>Error</dt>)}
                {hasError && (<dd className={styles.errorDetails}>{properties.errorDetails}</dd>)}
              </dl>
              <div className={styles.removeToggle}>
                <button onClick={this.handleRemoveJob}>
                  Remove this Job
                </button>
              </div>
              <div className={styles.removeWarning}>
                <h4>
                  <i className="fa fa-warning"/> Are you sure you want to remove this job from your list?
                </h4>
                <button onClick={this.handleRemoveJobConfirm}>Remove this Job</button>
                <button onClick={this.handleRemoveJob}>Cancel</button>
              </div>
            </div>
          </div>

          <div
            className={styles.controls}
            onMouseEnter={() => this.setState({ isControlHover: true })}
            onMouseLeave={() => this.setState({ isControlHover: false })}
          >
            <Link
              pathname="/jobs"
              search={`?jobId=${id}`}
              title="View on Map"
              onClick={this.handleViewOnMapClick}>
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
        </div>
      </li>
    )
  }

  //
  // Internals
  //

  private get activeJobId() {
    return 'JobStatus-' + this.props.job.properties.job_id
  }

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
      case STATUS_PENDING: return styles.pending
      case STATUS_RUNNING: return styles.running
      case STATUS_TIMED_OUT: return styles.timedOut
      case STATUS_ERROR: return styles.failed
      case STATUS_FAIL: return styles.failed
      case STATUS_CANCELLED: return styles.cancelled
      case STATUS_ACTIVATING: return styles.activating
      case STATUS_SUBMITTED: return styles.submitted
      default: return ''
    }
  }

  private jobTitleClick() {
    if (this.props.map.selectedFeature === this.props.job) {
      this.toggleExpansion()
    }

    this.props.dispatch.map.setSelectedFeature(this.props.job)
  }

  private handleDownloadProgress(loaded: number, total: number) {
    this.setState({ downloadProgress: total ? Math.floor(100 * loaded / total) : NaN })
  }

  private handleDownloadStart() {
    this.setState({ isDownloading: true })
  }

  private handleDownloadComplete() {
    this.setState({ isDownloading: false })
  }

  private handleDownloadError() {
    this.setState({ isDownloading: false })
  }

  private handleRemoveJob() {
    this.setState({ isRemoving: !this.state.isRemoving })
  }

  private handleRemoveJobConfirm() {
    this.props.dispatch.jobs.deleteJob(this.props.job)
  }

  private handleViewOnMapClick(loc: Location) {
    if (!this.props.map.map) {
      throw new Error('Map is null!')
    }

    this.props.dispatch.route.navigateTo({ loc })
    const feature = this.props.jobs.records.find(j => loc.search.includes(j.id))
    if (!feature) {
      throw new Error('Could not find feature!')
    }

    this.props.dispatch.map.panToExtent(featureToExtentWrapped(this.props.map.map, feature))
  }

  private toggleExpansion() {
    this.setState({
      isExpanded: !this.state.isExpanded,
      isRemoving: false,
    })

    this.props.onToggleExpansion(this.props.job, !this.state.isExpanded)
  }
}

//
// Helpers
//

function segmentIfNeeded(s: string) {
  return s.length > 30 ? s.replace(/(\W)/g, '$1 ') : s
}

function mapStateToProps(state: AppState) {
  return {
    map: state.map,
    jobs: state.jobs,
  }
}

function mapDispatchToProps(dispatch: Function) {
  return {
    dispatch: {
      map: {
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(Map.setSelectedFeature(feature)),
        panToExtent: (extent: Extent) => dispatch(Map.panToExtent(extent)),
      },
      jobs: {
        deleteJob: (job: beachfront.Job) => dispatch(Jobs.deleteJob(job)),
      },
      route: {
        navigateTo: (args: RouteNavigateToArgs) => dispatch(Route.navigateTo(args)),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(JobStatus)
