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

const styles: any = require('./CatalogSearchCriteria.css')
const DATE_FORMAT = 'YYYY-MM-DD'
const date_format = DATE_FORMAT.toLowerCase()

import * as React from 'react'
import {FormEvent} from 'react'
import {connect} from 'react-redux'
import {AxiosError} from 'axios'
import StaticMinimap from './StaticMinimap'
import * as moment from 'moment'
import {SCENE_TILE_PROVIDERS} from '../config'
import {catalogActions, CatalogUpdateSearchCriteriaArgs} from '../actions/catalogActions'
import {AppState} from '../store'
import {mapActions} from '../actions/mapActions'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type PassedProps = {
  errorElement?: React.ReactElement<any>
}
type Props = StateProps & DispatchProps & PassedProps

export class CatalogSearchCriteria extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.handleSourceChange = this.handleSourceChange.bind(this)
    this.handleApiKeyChange = this.handleApiKeyChange.bind(this)
    this.handleDateOfCaptureFromChange = this.handleDateOfCaptureFromChange.bind(this)
    this.handleDateOfCaptureToChange = this.handleDateOfCaptureToChange.bind(this)
    this.handleCloudCoverChange = this.handleCloudCoverChange.bind(this)
    this.renderErrorElement = this.renderErrorElement.bind(this)
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.minimap}>
          <StaticMinimap />
          <div className={styles.clearBbox} onClick={this.props.actions.map.clearBbox}>
            <i className="fa fa-times-circle"/> Clear
          </div>
        </div>

        {this.renderErrorElement()}

        <h3>Catalog</h3>
        <label className={styles.source}>
          <span>Source</span>
          <select
            value={this.props.catalog.searchCriteria.source}
            onChange={this.handleSourceChange}
          >
            {SCENE_TILE_PROVIDERS
              .filter(p => this.props.apiStatus.enabledPlatforms.some(platform => p.prefix === platform))
              .map(p => (
                <option key={p.prefix} value={p.prefix}>{p.name} ({p.provider})</option>
              ))}
          </select>
        </label>
        {(SCENE_TILE_PROVIDERS.find(p => p.prefix === this.props.catalog.searchCriteria.source) || { hideApiKeyInput: false }).hideApiKeyInput ? '' :
          <label className={styles.apiKey}>
            <span>API Key</span>
            <input
              className={styles.apiKeyInput}
              value={this.props.catalog.apiKey}
              disabled={this.props.catalog.isSearching}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={this.handleApiKeyChange}
            />
          </label>}

        {(typeof this.props.catalog.searchCriteria.dateFrom !== 'undefined' && typeof this.props.catalog.searchCriteria.dateTo !== 'undefined') && (
          <div>
            <h3>Date of Capture</h3>
            <label className={styles.captureDateFrom}>
              <span>From</span>
              <input
                value={this.props.catalog.searchCriteria.dateFrom}
                type="text"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                placeholder={date_format}
                title={date_format}
                disabled={this.props.catalog.isSearching}
                onChange={this.handleDateOfCaptureFromChange}
              />
            </label>
            {isValidDate(this.props.catalog.searchCriteria.dateFrom) || <div className={styles.invalidDates}>
              Invalid date ({date_format})
            </div>}
            <label className={styles.captureDateTo}>
              <span>To</span>
              <input
                value={this.props.catalog.searchCriteria.dateTo}
                type="text"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                placeholder={date_format}
                title={date_format}
                disabled={this.props.catalog.isSearching}
                onChange={this.handleDateOfCaptureToChange}
              />
            </label>
            {isValidDate(this.props.catalog.searchCriteria.dateTo) || <div className={styles.invalidDates}>
              Invalid date ({date_format})
            </div>}
            {isValidDateRange(this.props.catalog.searchCriteria.dateFrom, this.props.catalog.searchCriteria.dateTo) || <div className={styles.invalidDates}>
              From date must be before To date.
            </div>}
          </div>
        )}

        <h3>Filters</h3>
        <label className={styles.cloudCover}>
          <span>Cloud Cover</span>
          <input
            value={this.props.catalog.searchCriteria.cloudCover.toString()}
            type="range"
            min="0"
            max="100"
            onChange={this.handleCloudCoverChange}
          />
          <span className={styles.value}>
        <span className={styles.leSign}>&le;&thinsp;</span>
            {this.props.catalog.searchCriteria.cloudCover}%
      </span>
        </label>
      </div>
    )
  }

  private handleSourceChange(e: FormEvent) {
    this.props.actions.catalog.updateSearchCriteria({
      source: (e.target as HTMLSelectElement).value,
    })
  }

  private handleApiKeyChange(e: FormEvent) {
    this.props.actions.catalog.setApiKey((e.target as HTMLInputElement).value)
  }

  private handleDateOfCaptureFromChange(e: FormEvent) {
    this.props.actions.catalog.updateSearchCriteria({
      dateFrom: (e.target as HTMLInputElement).value,
    })
  }

  private handleDateOfCaptureToChange(e: FormEvent) {
    this.props.actions.catalog.updateSearchCriteria({
      dateTo: (e.target as HTMLInputElement).value,
    })
  }

  private handleCloudCoverChange(e: FormEvent) {
    this.props.actions.catalog.updateSearchCriteria({
      cloudCover: parseInt((e.target as HTMLInputElement).value, 10),
    })
  }

  private renderErrorElement() {
    const error: Error = this.props.catalog.searchError
    if (!error) {
      return  // Nothing to do
    }

    let heading, details, stacktrace

    stacktrace = error.toString()

    const {response} = error as AxiosError
    switch (response && response.status) {
      case 401:
      case 403:
        heading = 'Unauthorized'
        details = 'Your credentials were rejected by the data source.  Please contact the Beachfront team for technical support.'
        break
      case 400:
        heading = 'Catalog did not understand request'
        details = 'Please contact the Beachfront team for technical support.'
        break
      case 404:
        heading = 'Catalog did not understand request'
        details = 'Please contact the Beachfront team for technical support.'
        break
      case 412:
        heading = 'Invalid API key'
        details = 'The API key you specified for accessing the data source was invalid or had insufficient permissions. Please contact the Beachfront team for technical support.'
        break
      case 500:
        heading = 'Catalog error'
        details = 'The Beachfront Catalog has experienced an error.  If this persists, please contact the Beachfront team for technical support.'
        break
      case 502:
      case 503:
        heading = 'Cannot communicate with Catalog'
        details = 'Unable to communicate with the Beachfront Catalog.  If this persists, please contact the Beachfront team for technical support.'
        break
      default:
        heading = 'Search failed'
        details = 'An unknown error has occurred. Please contact the Beachfront team for technical support.'
        stacktrace = error.stack
        break
    }

    return (
      <div className={styles.errorMessage}>
        <h4><i className="fa fa-warning"/> {heading}</h4>
        <p>{details}</p>
        <pre>{stacktrace}</pre>
      </div>
    )
  }
}

function isValidDate(date) {
  return moment.utc(date, DATE_FORMAT, true).isValid()
}

function isValidDateRange(from, to) {
  const fromMoment = moment.utc(from, DATE_FORMAT, true)
  const toMoment = moment.utc(to, DATE_FORMAT, true)

  return !fromMoment.isValid() || !toMoment.isValid() || fromMoment.isSameOrBefore(toMoment)
}

function mapStateToProps(state: AppState) {
  return {
    apiStatus: state.apiStatus,
    catalog: state.catalog,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      catalog: {
        setApiKey: (apiKey: string) => dispatch(catalogActions.setApiKey(apiKey)),
        updateSearchCriteria: (args: CatalogUpdateSearchCriteriaArgs) => (
          dispatch(catalogActions.updateSearchCriteria(args))
        ),
      },
      map: {
        clearBbox: () => dispatch(mapActions.clearBbox()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(CatalogSearchCriteria)
