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
import {getClient, DEFAULT_TIMEOUT} from './session'
import {
  API_ROOT,
  SCENE_TILE_PROVIDERS,
  IMAGERY_ENDPOINT,
  USER_ENDPOINT,
} from '../config'
import {wrap} from '../utils/math'

let _client: AxiosInstance

export function initialize(): Promise<void> {
  const session = getClient()

  return session.get(USER_ENDPOINT).then(_ => {
    _client = axios.create({
      baseURL: API_ROOT,
      timeout: DEFAULT_TIMEOUT,
      withCredentials: true,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Authorization': 'Basic Og==',
      },
    })
  }).catch(err => {
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

  // Wrap bbox X coordinates to stay within the -180/180 range. Some data sources won't return results otherwise.
  const bboxWidth = bbox[2] - bbox[0]
  const wrappedBbox = [...bbox]
  wrappedBbox[0] = wrap(wrappedBbox[0], -180, 180)
  wrappedBbox[2] = wrappedBbox[0] + bboxWidth

  let sceneTileProvider = SCENE_TILE_PROVIDERS.find(p => p.prefix === source)
  if (!!sceneTileProvider) {
    return _client.get(`${IMAGERY_ENDPOINT}/${sceneTileProvider.catalogSection}/discover/${source}`, {
      params: {
        cloudCover:      cloudCover + .05,
        PL_API_KEY:      catalogApiKey,
        bbox:            wrappedBbox.join(','),
        acquiredDate:    new Date(dateFrom).toISOString(),
        maxAcquiredDate: new Date(dateTo).toISOString(),
      },
    }).then(response => response.data).then(images => {
      // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
      console.warn('(catalog:search) Normalizing bf-ia-broker response')

      images.features.forEach(f => {
        f.id = source + ':' + f.id
      })

      return {
        images,
        count: images.features.length,
        startIndex: 0,
        totalCount: images.features.length,
      }
    }).catch(err => {
      // HACK HACK HACK HACK HACK HACK HACK HACK HACK HACK
      console.error('(catalog:search) failed:', err)
      throw err
    })
  } else {
    return <any>Promise.reject(new Error(`Unknown data source prefix: '${source}'`))
  }
}
