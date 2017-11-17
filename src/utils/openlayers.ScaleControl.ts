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

import Control from 'ol/control/control'

// I don't konw how to get the actual dpi of the monitor, thus the hard-coded value.
const DPI = 100
const MULTIPLIER = DPI / 0.0254

export class ScaleControl extends Control {
  $value: any

  constructor(className: string) {
    const element: any = document.createElement('div')
    super({ element })

    element.className = [className, 'ol-unselectable', 'ol-control'].filter(s => s).join(' ')
    element.title = 'Map Scale (click to edit)'
    element.innerHTML = `<div>
      1&#8197;:&#8197;<span
        class="value"
        contenteditable="true"
      ></span>
    </div>`

    this.$value = element.querySelector('.value') as any
    this.$value.onblur = this.blur.bind(this)
    this.$value.onkeydown = this.keydown.bind(this)

    setTimeout(() => {
      this.getMap().getView().on('change:resolution', event => {
        let res = event.target.getResolution()
        let scale = toSignificantDigits(toScale(res))

        this.$value.innerText = scale
      }, this)
    })
  }

  private blur() {
    const scale = +toUnformattedNumber(this.$value.innerText)
    const map = this.getMap()
    const view: any = map.getView()
    const oldResolution = view.getResolution()
    let resolution = toResolution(scale)

    resolution = resolution < view.getMaxResolution() ? resolution : view.getMaxResolution()
    resolution = resolution > view.getMinResolution() ? resolution : view.getMinResolution()

    view.animate({
      duration: 1618 * Math.abs(Math.log10(resolution / oldResolution)),
      resolution: resolution,
    })
  }

  private keydown(event) {
    event.stopPropagation()

    switch (event.key) {
      case ',':
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'Backspace':
      case 'Delete':
      case 'Tab':
        break
      case 'Enter':
        this.$value.blur()
        break
      default:
        event.preventDefault()
    }
  }
}

function toUnformattedNumber(n) {
  return +n.toString().replace(/[\s,]+|\..*/g, '')
}

function toSignificantDigits(n: number, s: number = 3): string {
  let m = Math.pow(10, Math.ceil(Math.log10(n)) - s)

  return (m * Math.round(n / m)).toLocaleString()
}

function toResolution(scale: number): number {
  return scale / MULTIPLIER
}

function toScale(resolution: number): number {
  return MULTIPLIER * resolution
}
