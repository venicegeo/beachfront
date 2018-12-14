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
import {AxiosResponse} from 'axios'
import * as moment from 'moment'
import {getClient} from '../api/session'
import {StaticMinimap} from './StaticMinimap'
import {SCENE_TILE_PROVIDERS} from '../config'

interface Props {
  apiKey: string
  bbox: number[]
  cloudCover: number
  dateFrom?: string
  dateTo?: string
  disabled?: boolean
  errorElement?: React.ReactElement<any>
  source: string
  onApiKeyChange(apiKey: string)
  onClearBbox()
  onCloudCoverChange(cloudCover: number)
  onDateChange?(dateFrom: string, dateTo: string)
  onSourceChange(source: string)
}

const apiKeyFormFileName = 'APIKeyForm.xlsx'

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
        {SCENE_TILE_PROVIDERS.map(p => (
          <option key={p.prefix} value={p.prefix}>{p.name} ({p.provider})</option>
        ))}
      </select>
    </label>
    <label className={styles.apiKey}>
      <span>API Key</span>
      <input
        value={props.apiKey}
        type="password"
        disabled={props.disabled}
        onChange={event => props.onApiKeyChange((event.target as HTMLInputElement).value)}
      />
    </label>
    {!props.apiKey && (
      <div className={styles.apiKeyInfo}>
        <span>To obtain an API key, please fill out <a href={`/${apiKeyFormFileName}`} onClick={downloadApiKeyDocument}>this document</a> and follow its instructions.</span>
      </div>
    )}

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
      <span className={styles.value}>&le;&thinsp;{props.cloudCover}%</span>
    </label>
  </div>
)

async function downloadApiKeyDocument(e: React.MouseEvent) {
  e.preventDefault()

  let response: AxiosResponse
  try {
    response = await getClient().get('/application/planet', {
      responseType: 'blob',
    })
  } catch (err) {
    alert(err.message)
    return
  }

  // Create the file url.
  const fileData = new Blob([response.data], {type: response.headers['content-type']})
  const file = window.URL.createObjectURL(fileData)

  // Download the file.
  const a = document.createElement('a') as HTMLAnchorElement
  a.href = file
  a.download = apiKeyFormFileName
  a.click()

  // Clean up the downloaded file url (to avoid memory leaks).
  window.URL.revokeObjectURL(file)
}

function isValidDate(date) {
  return moment.utc(date, DATE_FORMAT, true).isValid()
}

function isValidDateRange(from, to) {
  const fromMoment = moment.utc(from, DATE_FORMAT, true)
  const toMoment = moment.utc(to, DATE_FORMAT, true)

  return !fromMoment.isValid() || !toMoment.isValid() || fromMoment.isSameOrBefore(toMoment)
}
