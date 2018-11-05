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

const styles: any = require('./ImagerySearch.css')
const DATE_FORMAT = 'YYYY-MM-DD'

import * as React from 'react'
import {connect} from 'react-redux'
import * as moment from 'moment'
import CatalogSearchCriteria from './CatalogSearchCriteria'
import {LoadingAnimation} from './LoadingAnimation'
import { SCENE_TILE_PROVIDERS } from '../config'
import {AppState} from '../store'
import {catalogActions, CatalogSearchArgs} from '../actions/catalogActions'

type StateProps = Partial<ReturnType<typeof mapStateToProps>>
type DispatchProps = Partial<ReturnType<typeof mapDispatchToProps>>
type PassedProps = {}

type Props = PassedProps & StateProps & DispatchProps

export class ImagerySearch extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.handleSubmit = this.handleSubmit.bind(this)
  }

  render() {
    return (
      <div className={styles.root}>
        <h2>
          Source Imagery
        </h2>

        <form className={styles.root} onSubmit={this.handleSubmit}>
          <CatalogSearchCriteria />

          <div className={styles.controls}>
            <button
              type="button"
              onClick={this.props.actions.catalog.resetSearchCriteria}
            >
              Reset Defaults
            </button>

            <button type="submit" disabled={!this.canSubmit}>Search for Imagery</button>
          </div>

          {this.props.catalog.isSearching && (
            <div className={styles.loadingMask}>
              <LoadingAnimation className={styles.loadingAnimation}/>
            </div>
          )}
        </form>
      </div>
    )
  }

  //
  // Internals
  //

  private dateValidation() {
    const from = moment.utc(this.props.catalog.searchCriteria.dateFrom, DATE_FORMAT, true)
    const to = moment.utc(this.props.catalog.searchCriteria.dateTo, DATE_FORMAT, true)

    return from.isValid() && to.isValid() && from.isSameOrBefore(to)
  }

  private get canSubmit() {
    return !this.props.catalog.isSearching && (!this.apiKeyRequired || this.props.catalog.apiKey) && this.dateValidation()
  }

  private get apiKeyRequired() {
    return !(SCENE_TILE_PROVIDERS.find(p => p.prefix === this.props.catalog.searchCriteria.source) || { hideApiKeyInput: false }).hideApiKeyInput
  }

  private handleSubmit(event) {
    event.preventDefault()
    event.stopPropagation()
    this.props.actions.catalog.search()
  }
}

function mapStateToProps(state: AppState) {
  return {
    map: state.map,
    catalog: state.catalog,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    actions: {
      catalog: {
        resetSearchCriteria: () => dispatch(catalogActions.resetSearchCriteria()),
        search: (args?: CatalogSearchArgs) => dispatch(catalogActions.search(args)),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(ImagerySearch)
