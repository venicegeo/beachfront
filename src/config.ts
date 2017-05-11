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

export const API_ROOT = process.env.API_ROOT
export const CONSENT_BANNER_TEXT = {__html: process.env.CONSENT_BANNER_TEXT}

const time = {millisecond: 1, second: 1000, minute: 60000}

export const RECORD_POLLING_INTERVAL = 30 * time.second
export const UPDATE_WORKER_INTERVAL = 15 * time.minute

export const BASEMAP_TILE_PROVIDERS = [
  {
    name: 'OSM',
    url: 'https://osm.geointservices.io/osm_tiles/{z}/{x}/{y}.png64',
    attributions: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
    maxZoom: 20,
  },
]

export const SCENE_TILE_PROVIDERS = [
  {
    prefix: 'planetscope',
    url: 'https://tiles{0-3}.planet.com/v1/experimental/tiles/PSOrthoTile/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__',
    maxZoom:  13,
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (PlanetScope)</a>',
  },
  {
    prefix: 'rapideye',
    url: 'https://tiles{0-3}.planet.com/v1/experimental/tiles/REOrthoTile/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__',
    maxZoom:  13,
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (RapidEye)</a>',
  },
  {
    prefix: 'landsat',
    url: 'https://tiles{0-3}.planet.com/v1/experimental/tiles/Landsat8L1G/__SCENE_ID__/{z}/{x}/{y}.png?api_key=__API_KEY__',
    maxZoom:  12,
    attributions: '&copy; <a href="https://www.planet.com" target="_blank" rel="noopener">Planet Labs (Landsat8)</a>',
  },
]
