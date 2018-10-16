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
import {mapActions} from '../actions/mapActions'

const styles: any = require('./CatalogSearchCriteria.css')
const DATE_FORMAT = 'YYYY-MM-DD'
const date_format = DATE_FORMAT.toLowerCase()

import * as React from 'react'
import {connect} from 'react-redux'
import {StaticMinimap} from './StaticMinimap'
import * as moment from 'moment'
import {SCENE_TILE_PROVIDERS} from '../config'
import {catalogActions} from '../actions/catalogActions'

interface Props {
  apiKey: string
  bbox: number[]
  cloudCover: number
  dateFrom?: string
  dateTo?: string
  disabled?: boolean
  enabledPlatforms: string[]
  errorElement?: React.ReactElement<any>
  source: string
  catalogSetApiKey?: (catalogApiKey: string) => void
  onCloudCoverChange(cloudCover: number)
  onDateChange?(dateFrom: string, dateTo: string)
  onSourceChange(source: string)
  mapClearBbox?(): void
}

export class CatalogSearchCriteria extends React.Component<Props, null> {
  constructor(props) {
    super(props)

    this.handleSourceChange = this.handleSourceChange.bind(this)
    this.handleApiKeyChange = this.handleApiKeyChange.bind(this)
    this.handleDateOfCaptureFromChange = this.handleDateOfCaptureFromChange.bind(this)
    this.handleDateOfCaptureToChange = this.handleDateOfCaptureToChange.bind(this)
    this.handleCloudCoverChange = this.handleCloudCoverChange.bind(this)
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.minimap}>
          <StaticMinimap bbox={this.props.bbox}/>
          <div className={styles.clearBbox} onClick={this.props.mapClearBbox}>
            <i className="fa fa-times-circle"/> Clear
          </div>
        </div>

        {this.props.errorElement}

        <h3>Catalog</h3>
        <label className={styles.source}>
          <span>Source</span>
          <select
            value={this.props.source}
            onChange={this.handleSourceChange}
          >
            {SCENE_TILE_PROVIDERS
              .filter(p => this.props.enabledPlatforms.some(platform => p.prefix === platform))
              .map(p => (
                <option key={p.prefix} value={p.prefix}>{p.name} ({p.provider})</option>
              ))}
          </select>
        </label>
        {(SCENE_TILE_PROVIDERS.find(p => p.prefix === this.props.source) || { hideApiKeyInput: false }).hideApiKeyInput ? '' :
          <label className={styles.apiKey}>
            <span>API Key</span>
            <input
              className={styles.apiKeyInput}
              value={this.props.apiKey}
              disabled={this.props.disabled}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={this.handleApiKeyChange}
            />
          </label>}

        {(typeof this.props.dateFrom !== 'undefined' && typeof this.props.dateTo !== 'undefined') && (
          <div>
            <h3>Date of Capture</h3>
            <label className={styles.captureDateFrom}>
              <span>From</span>
              <input
                value={this.props.dateFrom}
                type="text"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                placeholder={date_format}
                title={date_format}
                disabled={this.props.disabled}
                onChange={this.handleDateOfCaptureFromChange}
              />
            </label>
            {isValidDate(this.props.dateFrom) || <div className={styles.invalidDates}>
              Invalid date ({date_format})
            </div>}
            <label className={styles.captureDateTo}>
              <span>To</span>
              <input
                value={this.props.dateTo}
                type="text"
                pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
                placeholder={date_format}
                title={date_format}
                disabled={this.props.disabled}
                onChange={this.handleDateOfCaptureToChange}
              />
            </label>
            {isValidDate(this.props.dateTo) || <div className={styles.invalidDates}>
              Invalid date ({date_format})
            </div>}
            {isValidDateRange(this.props.dateFrom, this.props.dateTo) || <div className={styles.invalidDates}>
              From date must be before To date.
            </div>}
          </div>
        )}

        <h3>Filters</h3>
        <label className={styles.cloudCover}>
          <span>Cloud Cover</span>
          <input
            value={this.props.cloudCover.toString()}
            type="range"
            min="0"
            max="100"
            onChange={this.handleCloudCoverChange}
          />
          <span className={styles.value}>
        <span className={styles.leSign}>&le;&thinsp;</span>
            {this.props.cloudCover}%
      </span>
        </label>
      </div>
    )
  }

  private handleSourceChange(e) {
    this.props.onSourceChange((e.target as HTMLSelectElement).value)
  }

  private handleApiKeyChange(e) {
    this.props.catalogSetApiKey((e.target as HTMLInputElement).value)
  }

  private handleDateOfCaptureFromChange(e) {
    this.props.onDateChange(
      (e.target as HTMLInputElement).value,
      this.props.dateTo,
    )
  }

  private handleDateOfCaptureToChange(e) {
    this.props.onDateChange(
      this.props.dateFrom,
      (e.target as HTMLInputElement).value,
    )
  }

  private handleCloudCoverChange(e) {
    this.props.onCloudCoverChange(
      parseInt((e.target as HTMLInputElement).value, 10)
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

function mapDispatchToProps(dispatch) {
  return {
    catalogSetApiKey: (catalogApiKey: string) => dispatch(catalogActions.setApiKey(catalogApiKey)),
    mapClearBbox: () => dispatch(mapActions.clearBbox()),
  }
}

export default connect(
  null,
  mapDispatchToProps,
)(CatalogSearchCriteria)
