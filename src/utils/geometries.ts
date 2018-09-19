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

import proj from 'ol/proj'
import GeoJSON from 'ol/format/geojson'
import extent from 'ol/extent'

const WGS84 = 'EPSG:4326'
const WEB_MERCATOR = 'EPSG:3857'

export function getFeatureCenter(feature, featureProjection = WGS84) {
  return extent.getCenter(featureToExtent(feature, featureProjection))
}

export function bboxToExtent(bbox: number[], featureProjection = WEB_MERCATOR, dataProjection = WGS84) {
  let [minLon, minLat, maxLon, maxLat] = bbox
  return new GeoJSON().readGeometry({type: 'Polygon', coordinates: [[
      [minLon, minLat],
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat],
    ]],
  }, {featureProjection, dataProjection}).getExtent()
}

export function featureToExtent(feature, featureProjection = WEB_MERCATOR, dataProjection = WGS84) {
  const geometry = readFeatureGeometry(feature, featureProjection, dataProjection)
  return geometry.getExtent()
}

export function readFeatureGeometry(feature, featureProjection = WEB_MERCATOR, dataProjection = WGS84) {
  const reader = new GeoJSON()
  return reader.readGeometry(feature.geometry, {featureProjection, dataProjection})
}

export function deserializeBbox(serialized) {
  if (serialized && serialized.length === 4) {
    return proj.transformExtent(serialized, WGS84, WEB_MERCATOR)
  }
  return null
}

export function serializeBbox(extent) {
  const bbox = proj.transformExtent(extent, WEB_MERCATOR, WGS84)
  const p1 = unwrapPoint(bbox.slice(0, 2))
  const p2 = unwrapPoint(bbox.slice(2, 4))
  return p1.concat(p2).map(truncate)
}

export function toGeoJSON(feature) {
  return new GeoJSON().writeFeatureObject(feature, {
    dataProjection: WGS84,
    featureProjection: WEB_MERCATOR,
  })
}

//
// Helpers
//

function truncate(n: number) {
  return Math.round(n * 100) / 100
}

function unwrapPoint([x, y]: number[]) {
  return [
    x > 0 ? Math.min(180, x) : Math.max(-180, x),
    y,
  ]
}
