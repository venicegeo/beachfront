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
import {connect} from 'react-redux'

const styles: any = require('./JobStatusList.css')
const jobStatusStyles: any = require('./JobStatus.css')

import * as React from 'react'
import JobStatus from './JobStatus'
import * as moment from 'moment'
import {AppState} from '../store'
import {MapState} from '../reducers/mapReducer'

interface Props {
  map?: MapState
  error: any
  jobs: beachfront.Job[]
  onDismissError()
  onForgetJob(job: beachfront.Job)
  onNavigateToJob(loc: { pathname: string, search: string, hash: string })
}

interface State {
  activeIds: string[]
}

export class JobStatusList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.handleToggleExpansion = this.handleToggleExpansion.bind(this)
  }

  componentDidUpdate(prevProps) {
    if (this.props.map.selectedFeature !== prevProps.selectedFeature) {
      this.scrollToSelectedJob()
    }

    if (this.props.map.detections !== prevProps.map.detections) {
      this.setState({ activeIds: this.props.map.detections.map(d => d.id) })
    }
  }

  render() {
    return (
      <div className={`${styles.root} ${!this.props.jobs.length ? styles.isEmpty : ''}`}>
        <header>
          <h1>Jobs</h1>
        </header>

        <ul>
          {this.props.error && (
            <li className={styles.communicationError}>
              <h4><i className="fa fa-warning"/> Communication Error</h4>
              <p>Cannot communicate with the server. (<code>{this.props.error.toString()}</code>)</p>
              <button onClick={this.props.onDismissError}>Retry</button>
            </li>
          )}

          {!this.props.jobs.length ? (
            <li className={styles.placeholder}>You haven't started any Jobs yet</li>
          ) : this.props.jobs.sort((job1, job2) => {
            return moment(job1.properties.created_on).isBefore(job2.properties.created_on) ? 1 : -1
          }).map(job => (
            <JobStatus
              key={job.id}
              isActive={this.state.activeIds.includes(job.id)}
              job={job}
              onNavigate={this.props.onNavigateToJob}
              onForgetJob={this.props.onForgetJob}
              onToggleExpansion={this.handleToggleExpansion}
              selectedFeature={this.props.map.selectedFeature}
            />
          ))}
        </ul>
      </div>
    )
  }

  private handleToggleExpansion(job: beachfront.Job, isExpanded: boolean) {
    if (isExpanded) {
      // Fit the metadata into view once it finishes expanding.
      const row = document.querySelector(`.JobStatus-${job.properties.job_id}`)
      const handleTransitionEnd = (e) => {
        this.scrollToJob(job)
        row.removeEventListener(e.type, handleTransitionEnd)
      }
      row.addEventListener('transitionend', handleTransitionEnd)
    }
  }

  private scrollToSelectedJob() {
    const job = this.props.map.selectedFeature as beachfront.Job
    if (job) {
      this.scrollToJob(job)
    }
  }

  private scrollToJob(job) {
    const row = document.querySelector(`.JobStatus-${job.properties.job_id}`)
    if (row) {
      const offset = [
        '.JobStatusList-root header',
        '.ClassificationBanner-root',
      ].reduce((rc, s) => rc + document.querySelector(s).clientHeight, 0)

      const box = row.getBoundingClientRect()
      const height = window.innerHeight || document.documentElement.clientHeight

      if (Math.floor(box.top) <= offset || box.bottom > height - row.clientHeight) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
  }

}

function mapStateToProps(state: AppState) {
  return {
    map: state.map,
  }
}

export default connect(
  mapStateToProps,
  null
)(JobStatusList)
