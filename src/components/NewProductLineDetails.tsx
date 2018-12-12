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

const styles = require('./NewProductLineDetails.css')

import * as React from 'react'

interface Props {
  name:      string
  dateStart: string
  dateStop:  string
  onNameChange: (name: string) => void
  onDateChange: (dateFrom: string, dateTo: string) => void
}

export const NewProductLineDetails = ({ name, dateStart, dateStop, onNameChange, onDateChange }: Props) => (
  <div className={styles.root}>
    <h2>Product Line Details</h2>

    <h3>Mission</h3>
    <label className={styles.field}>
      <span>Name</span>
      <input
        type="text"
        value={name}
        onChange={event => onNameChange((event.target as HTMLInputElement).value)}
      />
    </label>
    <label className={styles.field}>
      <span>Category</span>
      <select disabled={true}>
        <option>Maritime/Coastal</option>
      </select>
    </label>

    <h3>Scheduling</h3>
    <label className={styles.field}>
      <span>Start Date</span>
      <input
        type="text"
        value={dateStart}
        onChange={event => onDateChange((event.target as HTMLInputElement).value, dateStop)}
      />
    </label>
    <label className={styles.field}>
      <span>Stop Date</span>
      <input
        type="text"
        value={dateStop}
        onChange={event => onDateChange(dateStart, (event.target as HTMLInputElement).value)}
      />
    </label>
  </div>
)
