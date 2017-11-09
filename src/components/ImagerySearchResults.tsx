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

const styles: any = require('./ImagerySearchResults.css')

import * as React from 'react'
import {paginate} from '../utils/pagination'

interface Props {
  className?: string
  imagery: beachfront.ImageryCatalogPage
  isSearching: boolean
  onPageChange(page: {count: number, startIndex: number})
}

export class ImagerySearchResults extends React.Component<Props, void> {
  constructor() {
    super()
    this.emitPageBack    = this.emitPageBack.bind(this)
    this.emitPageForward = this.emitPageForward.bind(this)
  }

  render() {
    return (
      <div className={`${styles.root} ${this.props.className || ''}`}>
        {this.props.imagery && this.renderContent(this.props.imagery)}
      </div>
    )
  }

  private renderContent(imagery) {
    if (this.props.isSearching) {
      return <div className={styles.searching}>
        <span>Searching for Imagery&hellip;</span>
      </div>
    }

    if (!imagery.totalCount) {
      return <div className={styles.noResults}>No imagery found</div>
    }

    const {page, pages} = paginate(imagery)

    if (page === 1 && pages === 1) {
      return null
    }

    return (
      <div className={styles.pager}>
        <button disabled={page <= 1} onClick={this.emitPageBack}>
          <i className="fa fa-chevron-left"/>
        </button>
        <span>Page {page} of {pages}</span>
        <button disabled={page >= pages} onClick={this.emitPageForward}>
          <i className="fa fa-chevron-right"/>
        </button>
      </div>
    )
  }

  private emitPageBack() {
    const {count, startIndex} = this.props.imagery
    this.props.onPageChange({
      count,
      startIndex: startIndex - count,
    })
  }

  private emitPageForward() {
    const {count, startIndex} = this.props.imagery
    this.props.onPageChange({
      count,
      startIndex: startIndex + count,
    })
  }
}
