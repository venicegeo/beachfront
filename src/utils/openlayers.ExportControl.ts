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
import proj from 'ol/proj'
import * as moment from 'moment'

export class ExportControl extends Control {
  element: Element

  constructor(className: string) {
    const element = document.createElement('div')
    super({element})
    element.className = `${className || ''} ol-unselectable ol-control`
    element.title = 'Click to export an image of this map'
    element.innerHTML = '<a href="map.png"><i class="fa fa-download"/></a>'
    const hyperlink = this.element.firstChild
    if (!hyperlink) {
      throw new Error('Could not find hyperlink!')
    }
    hyperlink.addEventListener('click', this._clicked.bind(this))
  }

  _clicked() {
    const map = this.getMap()
    const hyperlink = this.element.firstChild as HTMLAnchorElement
    const timestamp = moment().format('llll')

    hyperlink.setAttribute('download', `BEACHFRONT_EXPORT_${timestamp}.png`)
    map.once('postcompose', (event: ol.render.Event) => {
      const canvas = event.context.canvas
      const imageData = event.context.getImageData(0, 0, canvas.width, canvas.height)
      const newCanvas = document.createElement('canvas')
      const context = newCanvas.getContext('2d')
      if (!context) {
        throw new Error('Could not get context!')
      }

      newCanvas.width = canvas.width
      newCanvas.height = canvas.height
      context.putImageData(imageData, 0, 0)

      const extent = map.getView().calculateExtent(map.getSize())
      const transformedExtent = proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326')
      const truncatedExtent = transformedExtent.map(n => n.toFixed(2))

      context.fillStyle = 'white'
      context.fillRect(0, newCanvas.height - 50, newCanvas.width, 50)
      context.font = '12pt monospace'
      context.fillStyle = 'black'
      context.textAlign = 'left'
      context.fillText(timestamp, 10, (newCanvas.height - 20))
      context.textAlign = 'right'
      context.fillText('Viewport: ' + truncatedExtent, newCanvas.width - 10, (newCanvas.height - 20))
      hyperlink.href = newCanvas.toDataURL()
    })
    map.renderSync()
  }
}
