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

const styles: any = require('./StaticMinimap.css')

import * as React from 'react'
import Map from 'ol/map'
import Polygon from 'ol/geom/polygon'
import Tile from 'ol/layer/tile'
import VectorLayer from 'ol/layer/vector'
import XYZ from 'ol/source/xyz'
import VectorSource from 'ol/source/vector'
import Feature from 'ol/feature'
import Fill from 'ol/style/fill'
import Stroke from 'ol/style/stroke'
import Style from 'ol/style/style'
import View from 'ol/view'

import {BASEMAP_TILE_PROVIDERS} from '../config'
import {deserializeBbox} from '../utils/geometries'

const [DEFAULT_TILE_PROVIDER] = BASEMAP_TILE_PROVIDERS

interface Props {
  bbox: number[]
}

export class StaticMinimap extends React.Component<Props, {}> {
  refs: any

  private map: Map

  componentDidMount() {
    this.initializeMap()
  }

  componentWillUnmount() {
    this.destroyMap()
  }

  render() {
    return (
      <div ref="target" className={styles.root}/>
    )
  }

  //
  // Internal API
  //

  private initializeMap() {
    const bbox = deserializeBbox(this.props.bbox)
    const bboxGeometry = Polygon.fromExtent(bbox)
    this.map = new Map({
      controls: [],
      interactions: [],
      layers: [
        new Tile({
          source: new XYZ(DEFAULT_TILE_PROVIDER),
        }),
        new VectorLayer({
          source: new VectorSource({
            features: [
              new Feature({
                geometry: bboxGeometry,
              }),
            ],
          }),
          style: new Style({
            fill: new Fill({
              color: 'hsla(202, 70%, 50%, .3)',
            }),
            stroke: new Stroke({
              color: 'hsla(202, 70%, 50%, .7)',
              lineCap: 'square',
              lineJoin: 'square',
              width: 2,
            }),
          }),
        }),
      ],
      target: this.refs.target,
      view: new View({
        center: [0, 0],
        zoom: 1,
        maxZoom: 6,
      }),
    })
    this.map.getView().fit(bboxGeometry, this.map.getSize())
  }

  private destroyMap() {
    this.map.setTarget(null)
    this.map = null
  }
}
