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

const styles: any = require('./CreateJob.css')

import * as React from 'react'
import {connect} from 'react-redux'
import AlgorithmList from './AlgorithmList'
import ImagerySearch from './ImagerySearch'
import ImagerySearchList from './ImagerySearchList'
import {NewJobDetails} from './NewJobDetails'
import {PrimaryMap} from './PrimaryMap'
import {normalizeSceneId} from './SceneFeatureDetails'
import {TYPE_SCENE} from '../constants'
import {AppState} from '../store'
import {jobsActions, JobsCreateJobArgs} from '../actions/jobsActions'

type StateProps = Partial<ReturnType<typeof mapStateToProps>>
type DispatchProps = Partial<ReturnType<typeof mapDispatchToProps>>
type PassedProps = {
  mapRef: PrimaryMap
}

type Props = PassedProps & StateProps & DispatchProps

interface State {
  computeMask?: boolean
  name?: string
  selectedScene?: beachfront.Scene
}

export class CreateJob extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      computeMask: true,
      name: '',
    }

    this.handleSubmit = this.handleSubmit.bind(this)
    this.handleComputeMaskChange = this.handleComputeMaskChange.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.map.selectedFeature !== this.props.map.selectedFeature) {
      let selectedScene = null
      if (this.props.map.selectedFeature && this.props.map.selectedFeature.properties.type === TYPE_SCENE) {
        selectedScene = this.props.map.selectedFeature as beachfront.Scene
      }

      if (selectedScene !== this.state.selectedScene) {
        // Set the default name using the scene id.
        if (selectedScene) {
          this.setState({ name: normalizeSceneId(selectedScene.id) })
        }

        // Reset the algorithm error.
        if (this.props.jobs.createJobError) {
          this.props.actions.jobs.dismissCreateJobError()
        }
      }

      this.setState({ selectedScene })
    }
  }

  render() {
    return (
      <div className={styles.root}>
        <header>
          <h1>Create Job</h1>
        </header>
        <ul>
          {this.props.map.bbox && (
            <li className={styles.search}>
              <ImagerySearch />
            </li>
          )}

          {this.props.map.bbox && this.props.catalog.searchResults && this.props.mapRef && (
            <li className={styles.results}>
              <ImagerySearchList />
            </li>
          )}

          {this.props.map.bbox && this.state.selectedScene && (
            <li className={styles.details}>
              <NewJobDetails
                computeMask={this.state.computeMask}
                name={this.state.name}
                onComputeMaskChange={this.handleComputeMaskChange}
                onNameChange={this.handleNameChange}
              />
            </li>
          )}

          {this.props.map.bbox && this.state.selectedScene && (
            <li className={styles.algorithms}>
              <AlgorithmList
                sceneMetadata={this.state.selectedScene.properties}
                onSubmit={this.handleSubmit}
              />
            </li>
          )}

          {!this.props.map.bbox && (
            <li className={styles.placeholder}>
              <h3>Draw bounding box to search for imagery</h3>
            </li>
          )}
        </ul>
      </div>
    )
  }

  private handleSubmit(algorithm) {
    this.props.actions.jobs.createJob({
      algorithmId: algorithm.id,
      computeMask: this.state.computeMask,
      name: this.state.name,
      sceneId: this.state.selectedScene.id,
      catalogApiKey: this.props.catalog.apiKey,
    })
  }

  private handleComputeMaskChange(computeMask: boolean) {
    this.setState({ computeMask })
  }

  private handleNameChange(name) {
    this.setState({ name })
  }
}

function mapStateToProps(state: AppState) {
  return {
    catalog: state.catalog,
    map: state.map,
    jobs: state.jobs,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      jobs: {
        createJob: (args: JobsCreateJobArgs) => dispatch(jobsActions.createJob(args)),
        dismissCreateJobError: () => dispatch(jobsActions.dismissCreateJobError()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(CreateJob)
