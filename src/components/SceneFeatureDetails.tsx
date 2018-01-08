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

const styles: any = require('./SceneFeatureDetails.css')

import * as React from 'react'
import * as moment from 'moment'

interface Props {
  className?: string
  feature: beachfront.Scene
}

export const SceneFeatureDetails = ({className, feature}: Props) => (
  <div className={`${styles.root} ${className || ''}`}>
    <h1 title={normalizeId(feature.id)}>{normalizeId(feature.id)}</h1>

    <dl>
      <dt>Date Captured</dt>
      <dd>{moment.utc(feature.properties.acquiredDate).format('MM/DD/YYYY HH:mm z')}</dd>

      <dt>Cloud Cover</dt>
      <dd>{feature.properties.cloudCover.toFixed(0)}%</dd>

      <dt>Sensor Name</dt>
      <dd>{feature.properties.sensorName}</dd>
    </dl>
  </div>
)

function normalizeId(featureId) {
  if (!featureId) {
    return 'nil'
  }
  return featureId.replace(/^(landsat|sentinel|rapideye|planetscope):/, '')
}
