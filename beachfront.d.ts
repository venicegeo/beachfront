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

declare namespace beachfront {
  namespace _ {
    interface ProductLineProperties {
      algorithm_name: string
      category: string
      created_by: string
      created_on: string
      max_cloud_cover: number
      name: string
      owned_by: string
      spatial_filter_id: string
      status: string
      start_on: string
      stop_on: string
      type: 'PRODUCT_LINE'
    }

    interface JobProperties {
      job_id: string
      seed_job_id: string
      name: string
      status: string
      created_by: string
      created_on: string
      algorithm_id: string
      algorithm_name: string
      algorithm_version: string
      scene_id: string
      tide: number
      tide_min_24h: number
      tide_max_24h: number
      extras: any
      compute_mask: boolean
      type: 'JOB'
      errorDetails: string
      time_of_collect: string
    }

  }

  interface Algorithm {
    description: string
    id: string
    maxCloudCover: number
    name: string
    type: string
  }

  interface Job extends GeoJSON.Feature<GeoJSON.Polygon> {
    id: string
    properties: _.JobProperties
  }

  interface ProductLine extends GeoJSON.Feature<GeoJSON.Polygon> {
    id: string
    properties: _.ProductLineProperties
  }

  interface Scene extends GeoJSON.Feature<GeoJSON.Polygon> {
    id: string
    properties: SceneMetadata
  }

  interface SceneMetadata {
    type: 'SCENE'
    acquiredDate: string
    cloudCover: number
    resolution: number
    sensorName: string
  }

  interface ImageryCatalogPage {
    count: number
    startIndex: number
    totalCount: number
    images: GeoJSON.FeatureCollection<any>
  }
}

//
// Misc Interop
//

// Interop: Webpack

// @ts-ignore
declare const process: any

// @ts-ignore
declare const require: any

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string
    API_ROOT: string
    CLASSIFICATION_BANNER_BACKGROUND: string
    CLASSIFICATION_BANNER_FOREGROUND: string
    CLASSIFICATION_BANNER_TEXT: string
    CONSENT_BANNER_TEXT: string
    OSM_BASE_URL: string
    PLANET_BASE_URL: string
    USER_GUIDE_URL: string
    GEOSERVER_WORKSPACE_NAME: string
    GEOSERVER_LAYERGROUP_NAME: string
  }
}

interface NodeRequire {
  (path: string): void
  context(path: string, recursive: boolean, pattern?: RegExp): {
    keys(): string[]
    (...v: any[]): void,
  },
}

// Interop: core-js

interface String {
  includes(value: any, fromIndex?: number): boolean
}

interface Array<T> {
  includes(value: any, fromIndex?: number): boolean
}
