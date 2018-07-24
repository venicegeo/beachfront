/**
 * Copyright 2018, RadiantBlue Technologies, Inc.
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

import { Promise } from 'axios'
import { getClient } from './session'

export function getApiStatus(): Promise<ApiStatus> {
    const client = getClient()
    return client.get('/').then(response => response.data as ApiStatus)
        .catch(err => {
            console.error('(status:getStatus) failed:', err)
            throw err
        })
}

export function getEnabledPlatforms() {
    return getApiStatus().then(status => status['enabled-platforms'])
}

export function getGeoserverUrl() {
    return getApiStatus().then(status => status.geoserver)
}

export interface ApiStatus {
    geoserver: string
    'geoserver-upstream': string
    'enabled-platforms': string[]
    'outstanding-jobs': number
    uptime: number
}
