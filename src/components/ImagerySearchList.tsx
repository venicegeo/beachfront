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
const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm'

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
  private compare: any

  constructor(props: Props) {
    super(props)

    this.state = {
      sortBy: 'acquiredDate',
    }

    const compare = this.compare = {
      acquiredDate(a, b) {
        return moment.utc(a.properties.acquiredDate).diff(b.properties.acquiredDate)
          || compare.bbox(a, b)
      },
      bbox(a, b) {
        return b.bbox[3] - a.bbox[3] || a.bbox[0] - b.bbox[0] || compare.acquiredDate(a, b)
      },
      cloudCover(a, b) {
        return a.properties.cloudCover - b.properties.cloudCover || compare.acquiredDate(a, b)
      },
      sensorName(a, b) {
        if (a.properties.sensorName < b.properties.sensorName) {
          return -1
        } else if (a.properties.sensorName > b.properties.sensorName) {
          return 1
        } else {
          return compare.acquiredDate(a, b)
        }
      },
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
    const scenes = imagery.images.features.sort(this.compare[this.state.sortBy])

    return (
      <div className={styles.results}>
        <h2>{`${imagery.count} ${imagery.count === 1 ? 'Image' : 'Images'}`} Found</h2>

        <table>
          <thead>
            <tr>
              <td onClick={() => this.setState({ sortBy: 'sensorName' })}>Sensor</td>
              <td onClick={() => this.setState({ sortBy: 'bbox' })}>Location</td>
              <td onClick={() => this.setState({ sortBy: 'acquiredDate' })}>Date Captured (UTC)</td>
              <td onClick={() => this.setState({ sortBy: 'cloudCover' })}>Cloud Cover</td>
            </tr>
          </thead>
          <tbody>
            {scenes.map(f => {
              const loc = [
                f.bbox[0],
                f.bbox[3],
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
                  <td>{moment.utc(f.properties.acquiredDate).format(DATETIME_FORMAT)}</td>
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
