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

const styles: any = require('./ImagerySearchList.css')
const DATE_FORMAT = 'YYYY-MM-DD'

import * as React from 'react'
import * as moment from 'moment'

interface Props {
  hoverSceneIds: string[]
  imagery: beachfront.ImageryCatalogPage
  selectedScene: beachfront.Scene
  onClick(scene: beachfront.Scene)
  onMouseEnter(scene: beachfront.Scene)
  onMouseLeave(scene: beachfront.Scene)
}

interface State {
  sortBy: string
}

export class ImagerySearchList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      sortBy: null,
    }
  }

  componentDidUpdate(props: Props) {
    if (this.props.selectedScene && this.props.selectedScene !== props.selectedScene) {
      const row = document.querySelector(`.${styles.selected}`)

      if (row) {
        const box = row.getBoundingClientRect()
        const height = +(window.innerHeight || document.documentElement.clientHeight)

        if (Math.floor(box.top) <= 30 || box.bottom > height - 30) {
          row.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  render() {
    const { hoverSceneIds, imagery, selectedScene } = this.props
    const selectedSceneId = selectedScene && selectedScene.id
    const hoverIds = hoverSceneIds || []

    return (
      <div className={styles.results}>
        <h2>{`${imagery.count} ${imagery.count === 1 ? 'Image' : 'Images'}`} Found</h2>

        <table>
          <thead>
            <tr>
              <td>Sensor</td>
              <td>Location</td>
              <td>Date Captured (UTC)</td>
              <td>Cloud Cover</td>
            </tr>
          </thead>
          <tbody>
            {imagery.images.features.map(f => {
              const loc = [
                f.bbox[0],
                f.bbox[f.bbox.length - 1],
              ].map(n => n.toFixed(6)) // TODO: .map((s, i) => s.padStart(11 - i))

              return (
                <tr
                  className={[
                    selectedSceneId === f.id && styles.selected,
                    hoverIds.includes(f.id) && styles.hovered,
                  ].filter(Boolean).join(' ')}
                  key={f.id}
                  onClick={() => this.props.onClick(f as beachfront.Scene)}
                  onMouseEnter={() => this.props.onMouseEnter(f as beachfront.Scene)}
                  onMouseLeave={() => this.props.onMouseLeave(f as beachfront.Scene)}
                >
                  <td>{f.properties.sensorName}</td>
                  <td>{loc.join(', ')}</td>
                  <td>{moment.utc(f.properties.acquiredDate).format(`${DATE_FORMAT} HH:mm`)}</td>
                  <td>{f.properties.cloudCover.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }
}
