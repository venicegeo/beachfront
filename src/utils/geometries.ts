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

import * as ol from '../utils/ol'
import {WEB_MERCATOR, WGS84} from '../constants'

export type Point = [number, number]
export type Extent = [number, number, number, number]

export const WEB_MERCATOR_MIN = ol.proj.transform([-180, -90], WGS84, WEB_MERCATOR)
export const WEB_MERCATOR_MAX = ol.proj.transform([180, 90], WGS84, WEB_MERCATOR)

export function getFeatureCenter(feature, featureProjection = WGS84) {
  return ol.extent.getCenter(featureToExtent(feature, featureProjection))
}

export function bboxToExtent(bbox: number[], featureProjection = WEB_MERCATOR, dataProjection = WGS84) {
  let [minLon, minLat, maxLon, maxLat] = bbox
  return new ol.GeoJSON().readGeometry({type: 'Polygon', coordinates: [[
      [minLon, minLat],
      [minLon, maxLat],
      [maxLon, maxLat],
      [maxLon, minLat],
      [minLon, minLat],
    ]],
  }, {featureProjection, dataProjection}).getExtent()
}

export function featureToExtent(feature: GeoJSON.Feature<GeoJSON.Polygon>,
                                featureProjection = WEB_MERCATOR,
                                dataProjection = WGS84) {
  const geometry = readFeatureGeometry(feature, featureProjection, dataProjection)
  return geometry.getExtent()
}

export function featureToExtentWrapped(map: ol.Map,
                                       feature: GeoJSON.Feature<GeoJSON.Polygon>,
                                       featureProjection = WEB_MERCATOR,
                                       dataProjection = WGS84) {
  const geometry = readFeatureGeometry(feature, featureProjection, dataProjection)
  return extentWrapped(map, calculateExtent(geometry))
}

export function readFeatureGeometry(feature, featureProjection = WEB_MERCATOR, dataProjection = WGS84) {
  const reader = new ol.GeoJSON()
  return reader.readGeometry(feature.geometry, {featureProjection, dataProjection})
}

export function deserializeBbox(serialized) {
  if (serialized && serialized.length === 4) {
    return ol.proj.transformExtent(serialized, WGS84, WEB_MERCATOR)
  }
  return null
}

export function serializeBbox(extent) {
  const bbox = ol.proj.transformExtent(extent, WEB_MERCATOR, WGS84)
  const p1 = bbox.slice(0, 2)
  const p2 = bbox.slice(2, 4)
  return p1.concat(p2).map(truncate) as Extent
}

export function toGeoJSON(feature) {
  return new ol.GeoJSON().writeFeatureObject(feature, {
    dataProjection: WGS84,
    featureProjection: WEB_MERCATOR,
  })
}

export function getWrapIndex(map: ol.Map, positionWgs: Point) {
  // Return an index that signifies how many full map distances the position is from the map center.
  const mapCenter = ol.proj.transform(map.getView().getCenter(), WEB_MERCATOR, WGS84)
  const distanceToMapCenter = mapCenter[0] - positionWgs[0]

  if (distanceToMapCenter < 0) {
    return Math.ceil((distanceToMapCenter - 180) / 360)
  } else {
    return Math.floor((distanceToMapCenter + 180) / 360)
  }
}

export function extentWrapped(map: ol.Map, extent: Extent) {
  // Return an extent that's wrapped so that it follows the camera as it pans across a looping map.
  let extentWgs = ol.proj.transformExtent(extent, WEB_MERCATOR, WGS84)
  const centroid = [
    (extentWgs[0] + extentWgs[2]) / 2,
    (extentWgs[1] + extentWgs[3]) / 2,
  ] as Point

  const wrapIndex = getWrapIndex(map, centroid)
  extentWgs[0] += wrapIndex * 360
  extentWgs[2] += wrapIndex * 360

  return ol.proj.transformExtent(extentWgs, WGS84, WEB_MERCATOR)
}

export function calculateExtent(geometry: ol.Geometry) {
  if (geometry instanceof ol.MultiPolygon && crossesMeridian(geometry)) {
    const extents = geometry.getPolygons().map(g => ol.proj.transformExtent(g.getExtent(), WEB_MERCATOR, WGS84))
    let [, minY, , maxY] = ol.proj.transformExtent(geometry.getExtent(), WEB_MERCATOR, WGS84)
    let width = 0
    let minX = 180

    for (const [polygonMinX, , polygonMaxX] of extents) {
      width += polygonMaxX - polygonMinX

      if (polygonMaxX > 0) {
        minX -= polygonMaxX - polygonMinX
      }
    }

    return ol.proj.transformExtent([minX, minY, minX + width, maxY], WGS84, WEB_MERCATOR)
  }

  return geometry.getExtent()  // Use as-is
}

export function crossesMeridian(geometry: ol.Geometry) {
  const [minX, , maxX] = ol.proj.transformExtent(geometry.getExtent(), WEB_MERCATOR, WGS84)
  return minX === -180 && maxX === 180
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
