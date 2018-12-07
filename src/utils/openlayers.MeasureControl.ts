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

import Control from 'ol/control/control'
import LineString from 'ol/geom/linestring'
import Draw from 'ol/interaction/draw'
import VectorLayer from 'ol/layer/vector'
import proj from 'ol/proj'
import VectorSource from 'ol/source/vector'
import Sphere from 'ol/sphere'
import RegularShape from 'ol/style/regularshape'
import Stroke from 'ol/style/stroke'
import Style from 'ol/style/style'

const WGS84_SPHERE = new Sphere(6378137)
const PRECISION_KM = 10000
const PRECISION_M = 10
const KEY_ESCAPE = 27

export class MeasureControl extends Control {
  private _dialog: HTMLFormElement
  private _interaction: Draw
  private _layer: VectorLayer
  private _isOpen: boolean
  private _distanceInMeters: number

  constructor(className) {
    const element = document.createElement('div')
    super({ element })
    element.className = `${className || ''} ol-unselectable ol-control`
    element.title = 'Measure distance between two points'
    element.innerHTML = `
      <button style="position: relative;">
        <svg viewBox="2 2 40 40" preserveAspectRatio="xMinYMin" style="position: absolute; top: 10%; left: 10%; width: 80%; fill: currentColor;">
          <polygon fill-rule="evenodd" points="38.273059 27.2812229 30.5787737 34.9755082 28.4795901 32.8763246 36.1738754 25.1820393 31.6779573 20.6861213 28.3804065 23.9836721 26.2812229 21.8844885 29.5787737 18.5869377 25.0828557 14.0910197 21.7853049 17.3885705 19.6861213 15.2893869 22.9836721 11.9918361 18.4877541 7.49591803 10.7934688 15.1902033 8.69428524 13.0910197 16.3885705 5.39673442 12.9918361 2 2 12.9918361 29.0081639 40 40 40 40 29.0081639"></polygon>
        </svg>
      </button>
    `
    element.addEventListener('click', () => this._handleActivationToggle())

    this._layer = generateLayer()

    this._interaction = generateInteraction(this._layer)

    this._interaction.on('drawstart', () => {
      this._layer.getSource().clear()
    })

    this._interaction.on('drawend', (event: Draw.Event) => {
      const geometry = event.feature.getGeometry() as LineString
      const c1 = proj.transform(geometry.getFirstCoordinate(), 'EPSG:3857', 'EPSG:4326')
      const c2 = proj.transform(geometry.getLastCoordinate(), 'EPSG:3857', 'EPSG:4326')

      this._distanceInMeters = WGS84_SPHERE.haversineDistance(c1, c2)
      this._recalculate()
    })

    this._dialog = generateDialog()

    const unitsElement = this._dialog.querySelector('.measureControl__units')
    if (!unitsElement) {
      throw new Error('Could not find measure control units element!')
    }
    unitsElement.addEventListener('change', () => this._recalculate())

    const closeElement = this._dialog.querySelector('.measureControl__close')
    if (!closeElement) {
      throw new Error('Could not find measure control close element!')
    }
    closeElement.addEventListener('click', () => this._deactivate())

    this._handleDocumentKeyDown = this._handleDocumentKeyDown.bind(this)
  }

  private _activate() {
    this._isOpen = true
    this._dialog.style.display = 'block'
    this._dialog.reset()

    const map = this.getMap()
    if (!this._dialog.parentNode) {
      map.getTargetElement().appendChild(this._dialog)
    }

    map.addLayer(this._layer)
    map.addInteraction(this._interaction)
    map.dispatchEvent('measure:start')

    document.addEventListener('keydown', this._handleDocumentKeyDown)
  }

  private _deactivate() {
    this._isOpen = false
    this._dialog.style.display = 'none'
    this._dialog.reset()

    this._distanceInMeters = 0
    this._recalculate()

    this._layer.getSource().clear()

    const map = this.getMap()
    map.removeInteraction(this._interaction)
    map.removeLayer(this._layer)
    map.dispatchEvent('measure:end')

    document.removeEventListener('keydown', this._handleDocumentKeyDown)
  }

  private _recalculate() {
    const selectElement = this._dialog.querySelector('select')
    if (!selectElement) {
      throw new Error('Could not find select element!')
    }
    const isKilometers = selectElement.value === 'kilometers'
    const PRECISION = isKilometers ? PRECISION_KM : PRECISION_M
    const distance = isKilometers ? this._distanceInMeters / 1000 : this._distanceInMeters
    const distanceElement = this._dialog.querySelector('.measureControl__distance')
    if (!distanceElement) {
      throw new Error('Could not find measure control distance element!')
    }
    distanceElement.textContent = (Math.round(distance * PRECISION) / PRECISION).toString()
  }

  private _handleActivationToggle() {
    if (this._isOpen) {
      this._deactivate()
    }
    else {
      this._activate()
    }
  }

  private _handleDocumentKeyDown(event: KeyboardEvent) {
    if (event.keyCode === KEY_ESCAPE) {
      this._deactivate()
    }
  }
}

function generateDialog() {
  const dialog = document.createElement('form')
  dialog.className = 'measure-dialog'
  dialog.style.display = 'none'
  dialog.style.position = 'absolute'
  dialog.style.top = '40px'
  dialog.style.right = '70px'
  dialog.style.fontSize = '16px'
  dialog.style.backgroundColor = 'white'
  dialog.style.padding = '.25em'
  dialog.style.width = '300px'
  dialog.style.boxShadow = '0 0 0 1px rgba(0,0,0,.2), 0 5px rgba(0,0,0,.1)'
  dialog.style.borderRadius = '2px'
  dialog.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between;">
      <span>Measure Tool</span>
      <button class="measureControl__close" type="reset" style="border: none; background-color: transparent; font-size: inherit; color: #555;"><i class="fa fa-close"></i></button>
    </div>
    <label style="display: flex; align-items: center; justify-content: flex-end; background-color: #555; color: #fff; padding: .5em;">
      <code class="measureControl__distance" style="margin-right: .25em; font-size: 1.5em;">0</code>
      <select class="measureControl__units">
        <option selected>meters</option>
        <option>kilometers</option>
      </select>
    </label>
  `
  return dialog
}

function generateInteraction(drawLayer) {
  return new Draw({
    source: drawLayer.getSource(),
    maxPoints: 2,
    type: 'LineString',
    geometryFunction(coordinates: any, geometry: LineString) {
      if (!geometry) {
        geometry = new LineString([])
      }
      const [[x1, y1], [x2, y2]] = coordinates
      geometry.setCoordinates([[x1, y1], [x2, y2]])
      return geometry
    },
    style: new Style({
      image: new RegularShape({
        stroke: new Stroke({
          color: 'black',
          width: 1,
        }),
        points: 4,
        radius: 15,
        radius2: 0,
        angle: 0.785398,  // In radians
      }),
      stroke: new Stroke({
        color: '#f04',
        lineDash: [5, 10],
        width: 2,
      }),
    }),
  })
}

function generateLayer() {
  return new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      stroke: new Stroke({
        color: '#c03',
        lineDash: [10, 5],
        width: 3,
      }),
    }),
  })
}
