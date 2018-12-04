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

// Do all of our OpenLayers importing here so that we can avoid polluting file namespaces.
import Collection from 'ol/collection'
import condition from 'ol/events/condition'
import control from 'ol/control'
import coordinate from 'ol/coordinate'
import DragRotate from 'ol/interaction/dragrotate'
import Draw from 'ol/interaction/draw'
import extent from 'ol/extent'
import Feature from 'ol/feature'
import Fill from 'ol/style/fill'
import FullScreen from 'ol/control/fullscreen'
import GeoJSON from 'ol/format/geojson'
import Geometry from 'ol/geom/geometry'
import Image from 'ol/layer/image'
import ImageStatic from 'ol/source/imagestatic'
import interaction from 'ol/interaction'
import LineString from 'ol/geom/linestring'
import Map from 'ol/map'
import MousePosition from 'ol/control/mouseposition'
import MultiPolygon from 'ol/geom/multipolygon'
import Overlay from 'ol/overlay'
import Point from 'ol/geom/point'
import Polygon from 'ol/geom/polygon'
import proj from 'ol/proj'
import RegularShape from 'ol/style/regularshape'
import ScaleLine from 'ol/control/scaleline'
import Select from 'ol/interaction/select'
import Stroke from 'ol/style/stroke'
import Style from 'ol/style/style'
import Text from 'ol/style/text'
import Tile from 'ol/layer/tile'
import TileWMS from 'ol/source/tilewms'
import VectorLayer from 'ol/layer/vector'
import VectorSource from 'ol/source/vector'
import View from 'ol/view'
import XYZ from 'ol/source/xyz'
import ZoomSlider from 'ol/control/zoomslider'

export {Collection}
export {condition}
export {control}
export {coordinate}
export {DragRotate}
export {Draw}
export {extent}
export {Feature}
export {Fill}
export {FullScreen}
export {GeoJSON}
export {Geometry}
export {Image}
export {ImageStatic}
export {interaction}
export {LineString}
export {Map}
export {MousePosition}
export {MultiPolygon}
export {Overlay}
export {Point}
export {Polygon}
export {proj}
export {RegularShape}
export {ScaleLine}
export {Select}
export {Stroke}
export {Style}
export {Text}
export {Tile}
export {TileWMS}
export {VectorLayer}
export {VectorSource}
export {View}
export {XYZ}
export {ZoomSlider}

export default {
  Collection,
  condition,
  control,
  coordinate,
  DragRotate,
  Draw,
  extent,
  Feature,
  Fill,
  FullScreen,
  GeoJSON,
  Geometry,
  Image,
  ImageStatic,
  interaction,
  LineString,
  Map,
  MousePosition,
  MultiPolygon,
  Overlay,
  Point,
  Polygon,
  proj,
  RegularShape,
  ScaleLine,
  Select,
  Stroke,
  Style,
  Text,
  Tile,
  TileWMS,
  VectorLayer,
  VectorSource,
  View,
  XYZ,
  ZoomSlider,
}
