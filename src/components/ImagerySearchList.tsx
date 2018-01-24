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

interface Props {
  collections: any
  imagery: beachfront.ImageryCatalogPage
}

interface State {
  hoveredIds?: string[]
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
      selectedIds: [],
      sortBy: 'acquiredDate',
      sortReverse: false,
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

    this.scrollToSelected = this.scrollToSelected.bind(this)
  }

  componentDidMount() {
    this.props.collections.hovered.on(['add', 'remove'], debounce(event => {
      this.setState({
        hoveredIds: event.target.getArray().map(s => s.getId()),
      })
    }, 10))

    this.props.collections.selected.on(['add', 'remove'], debounce(event => {
      this.setState({
        selectedIds: event.target.getArray().map(s => s.getId()),
      }, this.scrollToSelected)
    }, 10))

    this.scrollToSelected()
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
        <h2>{`${scenes.length} ${scenes.length === 1 ? 'Image' : 'Images'}`} Found</h2>

        <table>
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
        </table>
      </div>
    )
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

  private sortOn(column: string) {
    if (this.state.sortBy === column) {
      this.setState({ sortReverse: !this.state.sortReverse })
    } else {
      this.setState({ sortBy: column, sortReverse: false })
    }
  }
}
