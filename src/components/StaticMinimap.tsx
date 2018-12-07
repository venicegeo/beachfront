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
import {connect} from 'react-redux'
import * as ol from '../utils/ol'

import {BASEMAP_TILE_PROVIDERS} from '../config'
import {deserializeBbox} from '../utils/geometries'
import {AppState} from '../store'

const [DEFAULT_TILE_PROVIDER] = BASEMAP_TILE_PROVIDERS

type StateProps = ReturnType<typeof mapStateToProps>
type Props = StateProps

export class StaticMinimap extends React.Component<Props> {
  refs: any

  private map: ol.Map | null

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
    const bbox = deserializeBbox(this.props.map.bbox)
    if (!bbox) {
      throw new Error('Unable to initialize map: bbox is null!')
    }
    const bboxGeometry = ol.Polygon.fromExtent(bbox)
    this.map = new ol.Map({
      controls: [],
      interactions: [],
      layers: [
        new ol.Tile({
          source: new ol.XYZ(DEFAULT_TILE_PROVIDER),
        }),
        new ol.VectorLayer({
          source: new ol.VectorSource({
            wrapX: false,
            features: [
              new ol.Feature({
                geometry: bboxGeometry,
              }),
            ],
          }),
          style: new ol.Style({
            fill: new ol.Fill({
              color: 'hsla(202, 70%, 50%, .3)',
            }),
            stroke: new ol.Stroke({
              color: 'hsla(202, 70%, 50%, .7)',
              lineCap: 'square',
              lineJoin: 'square',
              width: 2,
            }),
          }),
        }),
      ],
      target: this.refs.target,
      view: new ol.View({
        center: [0, 0],
        zoom: 1,
        maxZoom: 6,
      }),
    })
    this.map.getView().fit(bboxGeometry, { size: this.map.getSize() })
  }

  private destroyMap() {
    if (!this.map) {
      return
    }
    this.map.setTarget(null as any)
    this.map = null
  }
}

function mapStateToProps(state: AppState) {
  return {
    map: state.map,
  }
}

export default connect<StateProps, undefined>(
  mapStateToProps,
)(StaticMinimap)
