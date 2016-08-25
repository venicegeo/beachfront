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

import React, {Component} from 'react'
import {connect} from 'react-redux'
import AlgorithmList from './AlgorithmList'
import CatalogSearchCriteria from './CatalogSearchCriteria'
import NewProductLineDetails from './NewProductLineDetails'
import styles from './CreateProductLine.css'
import {
  createProductLine,
  changeProductLineName,
  resetProductLineName,
  selectProductLineAlgorithm,
  updateCatalogApiKey,
  updateSearchBbox,
  updateSearchCloudCover,
  updateSearchFilter,
} from '../actions'

// FIXME -- request list of supported bands for each provider from image catalog
const SUPPORTED_BANDS = {
  LANDSAT: {
    cirrus: true,
    coastal: true,
    green: true,
    nir: true,
    panchromatic: true,
    red: true,
    swir1: true,
    swir2: true,
    tirs1: true,
    tirs2: true,
  },
}

export class CreateProductLine extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  static propTypes = {
    algorithms:               React.PropTypes.array.isRequired,
    bbox:                     React.PropTypes.arrayOf(React.PropTypes.number),
    catalogApiKey:            React.PropTypes.string,
    cloudCover:               React.PropTypes.number.isRequired,
    filter:                   React.PropTypes.string,
    filters:                  React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
    isCreating:               React.PropTypes.bool.isRequired,
    name:                     React.PropTypes.string.isRequired,
    selectedAlgorithmId:      React.PropTypes.string,
    onAlgorithmSelect:        React.PropTypes.func.isRequired,
    onCatalogApiKeyChange:    React.PropTypes.func.isRequired,
    onClearBbox:              React.PropTypes.func.isRequired,
    onProductLineSubmit:      React.PropTypes.func.isRequired,
    onNameChange:             React.PropTypes.func.isRequired,
    onResetName:              React.PropTypes.func.isRequired,
    onSearchCloudCoverChange: React.PropTypes.func.isRequired,
    onSearchFilterChange:     React.PropTypes.func.isRequired,
  }

  constructor() {
    super()
    this.state = {isNameAutogenerated: true}
    this._handleNameChange = this._handleNameChange.bind(this)
    this._handleSubmit = this._handleSubmit.bind(this)
  }

  render() {
    return (
      <div className={styles.root}>
        <header>
          <h1>Create Product Line</h1>
        </header>
        <ul>
          {this.props.bbox && (
            <li>
              <CatalogSearchCriteria
                apiKey={this.props.catalogApiKey}
                bbox={this.props.bbox}
                cloudCover={this.props.cloudCover}
                filter={this.props.filter}
                filters={this.props.filters}
                onApiKeyChange={this.props.onCatalogApiKeyChange}
                onClearBbox={this.props.onClearBbox}
                onCloudCoverChange={this.props.onSearchCloudCoverChange}
                onFilterChange={this.props.onSearchFilterChange}
              />
              <NewProductLineDetails
                name={this.props.name}
                onNameChange={this._handleNameChange}
              />
              <AlgorithmList
                algorithms={this.props.algorithms}
                imageProperties={{
                  cloudCover: this.props.cloudCover,
                  bands: SUPPORTED_BANDS.LANDSAT,
                }}
                selectedId={this.props.selectedAlgorithmId}
                onSelect={this.props.onAlgorithmSelect}
                warningHeading="Incompatible Image Search Filters"
                warningMessage="Current image search filter settings do not meet all of this algorithm's requirements.  You can continue anyway, but it may not produce the expected results."
              />
              <div className={styles.controls}>
                <button className={styles.submitButton} onClick={this._handleSubmit}>Create Product Line</button>
              </div>
            </li>
          )}
          {!this.props.bbox && (
            <li className={styles.placeholder}>
              <h3>Draw bounding box to set AOI</h3>
            </li>
          )}
        </ul>
      </div>
    )
  }

  _handleAlgorithmSelect(algorithm) {
    if (this.state.isNameAutogenerated && this.props.selectedAlgorithmId !== algorithm.id) {
      this.props.onNameChange(generateName(algorithm.name))
    }
    this.props.onAlgorithmSelect(algorithm)
  }

  _handleNameChange(name) {
    this.setState({ isNameAutogenerated: false })
    this.props.onNameChange(name)
  }

  _handleSubmit() {
    this.props.onProductLineSubmit()
      .then(() => {
        this.context.router.push({ pathname: '/product-lines' })
      })
  }
}

export default connect(state => ({
  algorithms:          state.algorithms.records,
  bbox:                state.search.bbox,
  catalogApiKey:       state.catalog.apiKey,
  cloudCover:          state.search.cloudCover,
  dateToBegin:         state.search.dateToBegin,
  dateToEnd:           state.search.dateToEnd,
  isCreating:          state.draftProductLine.creating,
  filter:              state.search.filter,
  filters:             state.catalog.filters,
  name:                state.draftProductLine.name,
  selectedAlgorithmId: state.draftProductLine.algorithm && state.draftProductLine.algorithm.id,
}), dispatch => ({
  onProductLineSubmit:      (apiKey, name, algorithm) => dispatch(createProductLine(apiKey, name, algorithm)),
  onCatalogApiKeyChange:    (apiKey) => dispatch(updateCatalogApiKey(apiKey)),
  onClearBbox:              () => dispatch(updateSearchBbox()),
  onNameChange:             (name) => dispatch(changeProductLineName(name)),
  onResetName:              () => dispatch(resetProductLineName()),
  onSearchCloudCoverChange: (cloudCover) => dispatch(updateSearchCloudCover(cloudCover)),
  onSearchFilterChange:     (filter) => dispatch(updateSearchFilter(filter)),
  onAlgorithmSelect:        (algorithm) => dispatch(selectProductLineAlgorithm(algorithm))
}))(CreateProductLine)

//
// Helpers
//

function generateName(algorithm) {
  return `LANDSAT_${algorithm.name}`
}
