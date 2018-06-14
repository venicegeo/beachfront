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
import * as debounce from 'lodash/debounce'
import Collection from 'ol/collection'
import Select from 'ol/interaction/select'
import {SCENE_TILE_PROVIDERS} from '../config'

interface Props {
  collections: any
  imagery: beachfront.ImageryCatalogPage
}

interface State {
  hoveredIds?: string[]
  open?: boolean
  selectedIds?: string[]
  sortBy?: string
  sortReverse?: boolean
}

export class ImagerySearchList extends React.Component<Props, State> {
  private compare: any

  constructor(props: Props) {
    super(props)

    this.state = {
      hoveredIds: [],
      open: true,
      selectedIds: [],
      sortBy: 'acquiredDate',
      sortReverse: false,
    }

    const compareAcquiredDate = (a, b) => moment.utc(a.properties.acquiredDate).diff(b.properties.acquiredDate)
    const compareBbox = (a, b) => b.bbox[3] - a.bbox[3] || a.bbox[0] - b.bbox[0]
    const compareCloudCover = (a, b) => a.properties.cloudCover - b.properties.cloudCover
    const compareSensorName = (a, b) => a.properties.sensorName < b.properties.sensorName ? -1 : a.properties.sensorName > b.properties.sensorName ? 1 : 0

    this.compare = {
      acquiredDate(a, b) {
        return compareAcquiredDate(a, b) || compareBbox(a, b)
      },
      bbox(a, b) {
        return compareBbox(a, b) || compareAcquiredDate(a, b)
      },
      cloudCover(a, b) {
        return compareCloudCover(a, b) || compareAcquiredDate(a, b)
      },
      sensorName(a, b) {
        return compareSensorName(a, b) || compareAcquiredDate(a, b)
      },
    }

    this.getFeatureIds = this.getFeatureIds.bind(this)
    this.setHoveredIds = debounce(this.setHoveredIds.bind(this), 10)
    this.setSelectedIds = debounce(this.setSelectedIds.bind(this), 10)
    this.scrollToSelected = this.scrollToSelected.bind(this)
    this.sortOn = this.sortOn.bind(this)
  }

  componentDidMount() {
    this.props.collections.hovered.on(['add', 'remove'], this.setHoveredIds)
    this.props.collections.selected.on(['add', 'remove'], this.setSelectedIds)
    this.setHoveredIds()
    this.setSelectedIds()
    this.scrollToSelected()
  }

  componentWillUnmount() {
    this.props.collections.hovered.un(['add', 'remove'], this.setHoveredIds)
    this.props.collections.selected.un(['add', 'remove'], this.setSelectedIds)
  }

  render() {
    const scenes = this.props.imagery.images.features.sort(this.compare[this.state.sortBy])

    if (this.state.sortReverse) {
      scenes.reverse()
    }

    const TableHeader = (props: any) => {
      let icon = 'fa-sort'

      if (props.name === this.state.sortBy) {
        if (this.state.sortReverse) {
          icon += '-asc'
        } else {
          icon += '-desc'
        }
      }

      return (
        <td onClick={() => this.sortOn(props.name)}>
          {props.label}
          <i className={`fa ${icon}`}/>
        </td>
      )
    }

    return (
      <div className={styles.results}>
        <h2 onClick={() => this.setState({ open: !this.state.open })}>
          <i
            className={`fa fa-chevron-${this.state.open ? 'down' : 'right'}`}
          /> {scenes.length} {this.sourceName} {`${scenes.length === 1 ? 'Image' : 'Images'}`} Found
        </h2>

        {this.state.open && <table>
          <thead>
            <tr>
              <TableHeader name="sensorName" label="Sensor Name"/>
              <TableHeader name="bbox" label="Location"/>
              <TableHeader name="acquiredDate" label="Date Captured (UTC)"/>
              <TableHeader name="cloudCover" label="Cloud Cover"/>
            </tr>
          </thead>
          <tbody onMouseEnter={() => this.props.collections.hovered.clear()}>
            {scenes.map(f => {
              const loc = [f.bbox[0], f.bbox[3]].map(n => n.toFixed(6))

              return (
                <tr
                  className={[
                    this.state.selectedIds.includes(f.id) && styles.selected,
                    this.state.hoveredIds.includes(f.id) && styles.hovered,
                  ].filter(Boolean).join(' ')}
                  key={f.id}
                  onClick={() => this.props.collections.handleSelectFeature(f.id)}
                  onMouseEnter={() => {
                    const { imagery, hovered } = this.props.collections
                    hovered.push(imagery.getArray().find(i => i.getId() === f.id))
                  }}
                  onMouseLeave={() => this.props.collections.hovered.clear()}
                >
                  <td>{f.properties.sensorName}</td>
                  <td>{loc.join(', ')}</td>
                  <td>{moment.utc(f.properties.acquiredDate).format(DATETIME_FORMAT)}</td>
                  <td>{f.properties.cloudCover.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>}
      </div>
    )
  }

  private get sourceName() {
    const features = this.props.imagery.images.features as any
    let provider

    if (features.length) {
      const prefix = features[0].id.replace(/:.*/, '')

      provider = SCENE_TILE_PROVIDERS.find(p => p.prefix === prefix)
    }

    return provider ? provider.name : null
  }

  private getFeatureIds(collection: Collection): string[] {
    return collection.getArray().map(f => f.getId())
  }

  private scrollToSelected() {
    const row = document.querySelector(`.${styles.selected}`)

    if (row) {
      /*
       * This offset is the sum of all the elements that are above the
       * visible elements of the <tbody/> containing the search results.  It
       * helps determine if we need to scroll the results 'up' to make it
       * visible.
       */
      const offset = [
        `.${styles.results} thead`,
        '.CreateJob-root header',
        '.ClassificationBanner-root',
      ].reduce((rc, s) => rc + document.querySelector(s).clientHeight, 0)
      const box = row.getBoundingClientRect()
      const height = window.innerHeight || document.documentElement.clientHeight

      if (Math.floor(box.top) <= offset || box.bottom > height - row.clientHeight) {
        row.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }

  private setHoveredIds(event?: Select.Event): void {
    this.setState((_, props) => ({
      hoveredIds: this.getFeatureIds(event ? event.target : props.collections.hovered),
    }))
  }

  private setSelectedIds(event?: Select.Event): void {
    this.setState((_, props) => ({
      selectedIds: this.getFeatureIds(event ? event.target : props.collections.selected),
    }), this.scrollToSelected)
   }

  private sortOn(column: string) {
    if (this.state.sortBy === column) {
      this.setState({ sortReverse: !this.state.sortReverse })
    } else {
      this.setState({ sortBy: column, sortReverse: false })
    }
  }
}
