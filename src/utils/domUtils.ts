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

export function isElementInViewport(elem): boolean {
  const box = elem.getBoundingClientRect()
  const bannerHeight = 25
  const client = {
    height: (window.innerHeight || document.documentElement.clientHeight),
    width: (window.innerWidth || document.documentElement.clientWidth),
  }

  return box.top >= bannerHeight
    && box.left >= 0
    && parseInt(box.bottom) <= client.height - bannerHeight
    && parseInt(box.right) <= client.width
}

export function query(selector: string): HTMLElement {
  return document.querySelector(selector) as HTMLElement
}

export function scrollIntoView(selector: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let elem = typeof selector === 'string' ? query(selector) : selector

    if (elem) {
      if (isElementInViewport(elem)) {
        resolve()
      } else {
        elem.scrollIntoView(true, { behavior: 'smooth' })

        let timeout = 10000
        let t0 = Date.now()
        let interval = setInterval(() => {
          if (isElementInViewport(elem)) {
            clearInterval(interval)
            setTimeout(resolve, 100)
          } else if (Date.now() - t0 > timeout) {
            clearInterval(interval)
            reject(`Timed out after ${timeout / 1000} seconds scrolling ${selector} into view.`)
          }
        }, 100)
      }
    } else {
      let message = `The DOM element, "${selector}", is not available.`
      console.warn(message)
      reject(message)
    }
  })
}
