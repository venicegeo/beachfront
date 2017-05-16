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

import axios, {AxiosInstance, Promise} from 'axios'
import {getClient} from './session'

import {
  SOURCE_PLANETSCOPE,
  SOURCE_RAPIDEYE,
  SOURCE_LANDSAT,
  SOURCE_SENTINEL,
} from '../constants'

let _client: AxiosInstance

export function initialize(): Promise<void> {
  const session = getClient()
  return session.get('/v0/user')
    .then(response => {
      _client = axios.create({
        baseURL: response.data.services.catalog,
      })
    })
    .catch(err => {
      console.error('(catalog:initialize) failed:', err)
      throw err
    })
}

export function search({
  bbox,
  catalogApiKey,
  cloudCover,
  dateFrom,
  dateTo,
  source,
  startIndex,
  count,
}): Promise<beachfront.ImageryCatalogPage> {
  console.warn('(catalog:search): Discarding parameters `count` (%s) and `startIndex` (%s)', count, startIndex)
  let itemType
  switch (source) {
    case SOURCE_RAPIDEYE:
    case SOURCE_PLANETSCOPE:
    case SOURCE_LANDSAT:
      itemType = source
      break
    case SOURCE_SENTINEL:
      itemType = 'sentinel'
      break
    default:
      return Promise.reject(new Error(`Unknown data source prefix: '${source}'`))
  }
  return _client.get(`/planet/discover/${itemType}`, {
    params: {
      cloudCover:      cloudCover + .05,
      PL_API_KEY:      catalogApiKey,
      bbox:            bbox.join(','),
      acquiredDate:    new Date(dateFrom).toISOString(),
      maxAcquiredDate: new Date(dateTo).toISOString(),
    },
  })
    .then(response => response.data)
    // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
    .then(images => {
      console.warn('(catalog:search) Normalizing bf-ia-broker response')
      images.features.forEach(f => {
        f.id = source + ':' + f.id
      })
      return {
        images,
        count:      images.features.length,
        startIndex: 0,
        totalCount: images.features.length,
      }
    })
    // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
    .catch(err => {
      console.error('(catalog:search) failed:', err)
      throw err
    })
}
