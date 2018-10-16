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
import {AppState} from '../store'

const styles: any = require('./CreateJob.css')
const DATE_FORMAT = 'YYYY-MM-DD'

import * as React from 'react'
import {connect} from 'react-redux'
import * as moment from 'moment'
import {AlgorithmList} from './AlgorithmList'
import {ImagerySearch} from './ImagerySearch'
import {ImagerySearchList} from './ImagerySearchList'
import {NewJobDetails} from './NewJobDetails'
import {PrimaryMap} from './PrimaryMap'
import {createJob} from '../api/jobs'
import {normalizeSceneId} from './SceneFeatureDetails'
import {SOURCE_DEFAULT, TYPE_SCENE} from '../constants'
import {CatalogState} from '../reducers/catalogReducer'
import {MapState} from '../reducers/mapReducer'

export interface SearchCriteria {
  cloudCover: number
  dateFrom: string
  dateTo: string
  source: string
}

interface Props {
  catalog?: CatalogState
  map?: MapState
  algorithms: beachfront.Algorithm[]
  enabledPlatforms: string[]
  imagery: beachfront.ImageryCatalogPage
  isSearching: boolean
  mapRef: PrimaryMap
  searchError: any
  searchCriteria: SearchCriteria
  onJobCreated(job: beachfront.Job)
  onSearchCriteriaChange(criteria: SearchCriteria)
  onSearchSubmit()
}

interface State {
  isCreating?: boolean
  computeMask?: boolean
  name?: string
  algorithmError?: any
  selectedScene?: beachfront.Scene
}

export const createSearchCriteria = (): SearchCriteria => ({
  cloudCover: 10,
  dateFrom: moment().subtract(30, 'days').format(DATE_FORMAT),
  dateTo: moment().format(DATE_FORMAT),
  source: SOURCE_DEFAULT,
})

export class CreateJob extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      isCreating: false,
      computeMask: true,
      name: '',
      algorithmError: '',
    }

    this.handleCreateJob = this.handleCreateJob.bind(this)
    this.handleComputeMaskChange = this.handleComputeMaskChange.bind(this)
    this.handleNameChange = this.handleNameChange.bind(this)
    this.handleSearchCloudCoverChange = this.handleSearchCloudCoverChange.bind(this)
    this.handleSearchDateChange = this.handleSearchDateChange.bind(this)
    this.handleSearchSourceChange = this.handleSearchSourceChange.bind(this)
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
        if (this.state.algorithmError) {
          this.setState({ algorithmError: '' })
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
              <ImagerySearch
                enabledPlatforms={this.props.enabledPlatforms}
                bbox={this.props.map.bbox}
                catalogApiKey={this.props.catalog.apiKey}
                cloudCover={this.props.searchCriteria.cloudCover}
                dateFrom={this.props.searchCriteria.dateFrom}
                dateTo={this.props.searchCriteria.dateTo}
                error={this.props.searchError}
                isSearching={this.props.isSearching}
                source={this.props.searchCriteria.source}
                onCloudCoverChange={this.handleSearchCloudCoverChange}
                onDateChange={this.handleSearchDateChange}
                onSearchCriteriaChange={this.props.onSearchCriteriaChange}
                onSourceChange={this.handleSearchSourceChange}
                onSubmit={this.props.onSearchSubmit}
              />
            </li>
          )}

          {this.props.map.bbox && this.props.imagery && this.props.mapRef && (
            <li className={styles.results}>
              <ImagerySearchList
                collections={this.props.map.collections}
                imagery={this.props.imagery}
              />
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
                algorithms={this.props.algorithms}
                sceneMetadata={this.state.selectedScene.properties}
                isSubmitting={this.state.isCreating}
                error={this.state.algorithmError}
                onSubmit={this.handleCreateJob}
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

  private handleCreateJob(algorithm) {
    this.setState({
      isCreating: true,
      algorithmError: '',
    })

    createJob({
      algorithmId: algorithm.id,
      computeMask: this.state.computeMask,
      name: this.state.name,
      sceneId: this.state.selectedScene.id,
      catalogApiKey: this.props.catalog.apiKey,
    }).then(job => {
      this.setState({ isCreating: false })
      this.props.onJobCreated(job) // Release the job.
    }).catch(algorithmError => {
      this.setState({ algorithmError, isCreating: false })
    })
  }

  private handleSearchCloudCoverChange(cloudCover) {
    this.props.onSearchCriteriaChange(Object.assign({}, this.props.searchCriteria, {
      cloudCover: parseInt(cloudCover, 10),
    }))
  }

  private handleSearchDateChange(dateFrom, dateTo) {
    this.props.onSearchCriteriaChange(Object.assign({}, this.props.searchCriteria, {
      dateFrom,
      dateTo,
    }))
  }

  private handleSearchSourceChange(source: string) {
    this.props.onSearchCriteriaChange({ ...this.props.searchCriteria, source })
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
  }
}

export default connect(
  mapStateToProps,
  null,
)(CreateJob)
