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

const styles: any = require('./NewJobDetails.css')

import * as React from 'react'

interface Props {
  computeMask: boolean
  name: string
  onComputeMaskChange(value: boolean)
  onNameChange(value: string)
}

export const NewJobDetails = (props: Props) => (
  <div className={styles.root}>
    <h2>Job Details</h2>

    <label className={styles.field}>
      <span>Name</span>
      <input
        onChange={event => props.onNameChange((event.target as HTMLInputElement).value)}
        value={props.name}
      />
    </label>

    <label className={styles.field}>
      <span>Compute Mask</span>
      <input
        checked={props.computeMask}
        onChange={event => {
          props.onComputeMaskChange((event.target as HTMLInputElement).checked)
        }}
        type="checkbox"
      />
      <span className={styles.hint}>Limit to known coastal areas</span>
    </label>
  </div>
)
