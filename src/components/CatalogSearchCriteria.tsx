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
import {StaticMinimap} from './StaticMinimap'
import * as moment from 'moment'
import {SCENE_TILE_PROVIDERS} from '../config'

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
  onApiKeyChange(apiKey: string)
  onClearBbox()
  onCloudCoverChange(cloudCover: number)
  onDateChange?(dateFrom: string, dateTo: string)
  onSourceChange(source: string)
}

export const CatalogSearchCriteria = (props: Props) => (
  <div className={styles.root}>
    <div className={styles.minimap}>
      <StaticMinimap bbox={props.bbox}/>
      <div className={styles.clearBbox} onClick={props.onClearBbox}>
        <i className="fa fa-times-circle"/> Clear
      </div>
    </div>

    {props.errorElement}

    <h3>Catalog</h3>
    <label className={styles.source}>
      <span>Source</span>
      <select
        value={props.source}
        onChange={event => props.onSourceChange((event.target as HTMLSelectElement).value)}
      >
        {SCENE_TILE_PROVIDERS
          .filter(p => props.enabledPlatforms.some(platform => p.prefix === platform))
          .map(p => (
          <option key={p.prefix} value={p.prefix}>{p.name} ({p.provider})</option>
        ))}
      </select>
    </label>
    {(SCENE_TILE_PROVIDERS.find(p => p.prefix === props.source) || { hideApiKeyInput: false }).hideApiKeyInput ? '' :
    <label className={styles.apiKey}>
      <span>API Key</span>
      <input
        value={props.apiKey}
        type="password"
        disabled={props.disabled}
        onChange={event => props.onApiKeyChange((event.target as HTMLInputElement).value)}
      />
    </label>}

    {(typeof props.dateFrom !== 'undefined' && typeof props.dateTo !== 'undefined') && (
      <div>
        <h3>Date of Capture</h3>
        <label className={styles.captureDateFrom}>
          <span>From</span>
          <input
            value={props.dateFrom}
            type="text"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            placeholder={date_format}
            title={date_format}
            disabled={props.disabled}
            onChange={event => props.onDateChange(
              (event.target as HTMLInputElement).value,
              props.dateTo
            )}
          />
        </label>
        {isValidDate(props.dateFrom) || <div className={styles.invalidDates}>
          Invalid date ({date_format})
        </div>}
        <label className={styles.captureDateTo}>
          <span>To</span>
          <input
            value={props.dateTo}
            type="text"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
            placeholder={date_format}
            title={date_format}
            disabled={props.disabled}
            onChange={event => props.onDateChange(
              props.dateFrom,
              (event.target as HTMLInputElement).value
            )}
          />
        </label>
        {isValidDate(props.dateTo) || <div className={styles.invalidDates}>
          Invalid date ({date_format})
        </div>}
        {isValidDateRange(props.dateFrom, props.dateTo) || <div className={styles.invalidDates}>
          From date must be before To date.
        </div>}
      </div>
    )}

    <h3>Filters</h3>
    <label className={styles.cloudCover}>
      <span>Cloud Cover</span>
      <input
        value={props.cloudCover.toString()}
        type="range"
        min="0"
        max="100"
        onChange={event => props.onCloudCoverChange(
          parseInt((event.target as HTMLInputElement).value, 10)
        )}
      />
      <span className={styles.value}>
        <span className={styles.leSign}>&le;&thinsp;</span>
        {props.cloudCover}%
      </span>
    </label>
  </div>
)

function isValidDate(date) {
  return moment.utc(date, DATE_FORMAT, true).isValid()
}

function isValidDateRange(from, to) {
  const fromMoment = moment.utc(from, DATE_FORMAT, true)
  const toMoment = moment.utc(to, DATE_FORMAT, true)

  return !fromMoment.isValid() || !toMoment.isValid() || fromMoment.isSameOrBefore(toMoment)
}
