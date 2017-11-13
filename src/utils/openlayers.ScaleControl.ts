/**
 * Copyright 2017, Radiant Solutions
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

import * as ol from 'openlayers'

// I don't konw how to get the actual dpi of the monitor, thus the hard-coded value.
const DPI = 100
const MULTIPLIER = DPI / 0.0254

export class ScaleControl extends ol.control.Control {
  constructor(className: string) {
    const element = document.createElement('div')
    super({ element })

    element.className = [className, 'ol-unselectable', 'ol-control'].filter(s => s).join(' ')
    element.title = 'Map Scale'
    element.innerHTML = '<div class="value"></div>'

    setTimeout(() => {
      this.getMap().getView().on('change:resolution', event => {
        let res = event.target.getResolution()
        let scale = toSignificantDigits(toScale(res), 3)

        element.querySelector('.value').innerHTML = `<strong>${scale}</strong>&#8197;:&#8197;1`
        element.title = `Scale: ${scale} : 1`
      }, this)
    })
  }
}

function toSignificantDigits(n: number, s: number = 4): string {
  let m = Math.pow(10, Math.ceil(Math.log10(n)) - s)

  return (m * Math.round(n / m)).toLocaleString()
}

/*
function toResolution(scale: number): number {
  return scale / MULTIPLIER
}
*/

function toScale(resolution: number): number {
  return MULTIPLIER * resolution
}
