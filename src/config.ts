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

export const CLASSIFICATION_BANNER_BACKGROUND = process.env.CLASSIFICATION_BANNER_BACKGROUND
export const CLASSIFICATION_BANNER_FOREGROUND = process.env.CLASSIFICATION_BANNER_FOREGROUND
export const CLASSIFICATION_BANNER_TEXT       = process.env.CLASSIFICATION_BANNER_TEXT
export const OSM_BASE_URL                     = process.env.OSM_BASE_URL
export const PLANET_BASE_URL                  = process.env.PLANET_BASE_URL
export const USER_GUIDE_URL                   = process.env.USER_GUIDE_URL

export const API_ROOT = process.env.API_ROOT + (process.env.API_ROOT.endsWith('/') ? '' : '/')
export const CONSENT_BANNER_TEXT = {__html: process.env.CONSENT_BANNER_TEXT}

const time = {millisecond: 1, second: 1000, minute: 60000}

export const RECORD_POLLING_INTERVAL = 30 * time.second

export const SESSION_IDLE_TIMEOUT = 15
export const SESSION_IDLE_UNITS = 'minutes'
export const SESSION_IDLE_INTERVAL = time.minute
export const SESSION_IDLE_STORE = 'lastActivity'

export const JOB_ENDPOINT = '/job'
export const USER_ENDPOINT = '/user'
export const IMAGERY_ENDPOINT = '/ia'
export const ALGORITHM_ENDPOINT = '/algorithm'
export const PRODUCTLINE_ENDPOINT = '/feed'

export const BASEMAP_TILE_PROVIDERS = [
  {
    name: 'OSM',
    url: `https://${OSM_BASE_URL}/tiles/default/{z}/{x}/{y}.png64`,
    attributions: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 20,
  },
]

export const SCENE_TILE_PROVIDERS = [
  {
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (Copernicus Sentinel-2)</a>',
    maxZoom:  13,
    name: 'Copernicus Sentinel-2',
    prefix: 'sentinel_planet',
    catalogSection: 'planet', // Look in /planet/* in the catalog
    provider: 'Planet',
    url: `https://tiles{0-3}.${PLANET_BASE_URL}/v1/experimental/tiles/Sentinel2L1C/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__`,
    isXYZProvider: true,
    hideApiKeyInput: false,
  },
  {
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (Copernicus Sentinel-2)</a>',
    maxZoom: 13,
    name: 'Copernicus Sentinel-2',
    prefix: 'sentinel_s3',
    catalogSection: 'planet', // Look in /planet/* in the catalog
    provider: 'Planet with S3 imagery',
    url: `https://tiles{0-3}.${PLANET_BASE_URL}/v1/experimental/tiles/Sentinel2L1C/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__`,
    isXYZProvider: true,
    hideApiKeyInput: false,
  },
  {
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (Landsat8)</a>',
    maxZoom:  13,
    name: 'Landsat8',
    prefix: 'landsat',
    catalogSection: 'planet', // Look in /planet/* in the catalog
    provider: 'Planet',
    url: `https://tiles{0-3}.${PLANET_BASE_URL}/v1/experimental/tiles/Landsat8L1G/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__`,
    isXYZProvider: true,
    hideApiKeyInput: false,
  },
  {
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (RapidEye)</a>',
    maxZoom:  13,
    name: 'RapidEye',
    prefix: 'rapideye',
    catalogSection: 'planet', // Look in /planet/* in the catalog
    provider: 'Planet',
    url: `https://tiles{0-3}.${PLANET_BASE_URL}/v1/experimental/tiles/REOrthoTile/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__`,
    isXYZProvider: true,
    hideApiKeyInput: false,
  },
  {
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (PlanetScope)</a>',
    maxZoom:  13,
    name: 'PlanetScope',
    prefix: 'planetscope',
    catalogSection: 'planet', // Look in /planet/* in the catalog
    provider: 'Planet',
    url: `https://tiles{0-3}.${PLANET_BASE_URL}/v1/experimental/tiles/PSOrthoTile/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__`,
    isXYZProvider: true,
    hideApiKeyInput: false,
  },
  {
    attributions: '<a href="https://docs.opendata.aws/landsat-pds/readme.html">Landsat PDS</a>',
    name: 'Landsat8',
    prefix: 'landsat_pds',
    catalogSection: 'localindex', // Look in /localindex/* in the catalog
    provider: 'Public Data Set',
    url: `${API_ROOT}${IMAGERY_ENDPOINT}/localindex/preview/landsat_pds/__SCENE_ID__.jpg`,
    isXYZProvider: false,
    hideApiKeyInput: true,
  },

]

export const TOUR = {
  algorithm: ':first-child',
  /*
  apiKeyInstructions: `
    To get an API key, ask the experts at <a
      href="https://rocketchat.gs.mil/channel/planetdas_askanexpert"
      target="_blank"
    >Rocket.Chat #planetdas_askanexpert</a>.
  `,
  */
  apiKeyInstructions: `
    To get an API key you must have a Planet account.  For more information see <a
      href="https://support.planet.com/hc/en-us/articles/212318178-What-is-my-API-key-"
      target="_blank"
    >What Is My API Key?</a>
  `,
  basemap: 'OSM',
  bbox: [-85, 19.7, -74, 23.4],
  bboxName: 'Cuba',
  searchCriteria: {
    cloudCover: 6,
    dateFrom: '2017-07-01',
    dateTo: '2017-10-31',
    source: 'landsat',
  },
  zoom: 6,
}

// Minimum versions of supported browsers.
export const SUPPORTED_BROWSERS = {
  chrome: 55,
  firefox: 45,
}
