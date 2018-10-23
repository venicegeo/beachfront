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
import {productLinesActions} from '../actions/productLinesActions'

const styles = require('./ProductLineList.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {LoadingAnimation} from './LoadingAnimation'
import {ProductLine} from './ProductLine'
import {AppState} from '../store'
import {ProductLinesState} from '../reducers/productLinesReducer'

interface Props {
  productLines?: ProductLinesState
  onJobHoverIn(job: beachfront.Job)
  onJobHoverOut()
  onJobSelect(job: beachfront.Job)
  onJobDeselect()
  onPanTo(productLine: beachfront.ProductLine)
  productLinesFetch?(): void
}

export class ProductLineList extends React.Component<Props, {}> {
  render() {
    const isEmpty = (
      !this.props.productLines.records.length &&
      !this.props.productLines.fetching &&
      !this.props.productLines.fetchError
    )

    return (
      <div className={`${styles.root} ${isEmpty ? styles.isEmpty : ''}`}>
        <header>
          <h1>Product Lines</h1>
        </header>
        <ul>
          {this.props.productLines.fetchError && (
            <li className={styles.error}>
              <h4><i className="fa fa-warning"/> {this.props.productLines.fetchError.code ? 'Communication' : 'Application'} Error</h4>
              <p>{this.props.productLines.fetchError.code
                ? 'Cannot communicate with the server'
                : 'An error is preventing the display of product lines'
              }. (<code>{this.props.productLines.fetchError.message}</code>)</p>
              <button onClick={this.props.productLinesFetch}>Retry</button>
            </li>
          )}
          {this.props.productLines.records.map(productLine => (
            <ProductLine
              className={styles.listItem}
              key={productLine.id}
              productLine={productLine}
              onJobHoverIn={this.props.onJobHoverIn}
              onJobHoverOut={this.props.onJobHoverOut}
              onJobSelect={this.props.onJobSelect}
              onJobDeselect={this.props.onJobDeselect}
              onPanTo={this.props.onPanTo}
            />
          ))}
          {isEmpty && (
            <li className={styles.placeholder}>No product lines currently exist</li>
          )}
          {this.props.productLines.fetching && (
            <li className={styles.loadingMask}>
              <LoadingAnimation className={styles.loadingAnimation}/>
            </li>
          )}
        </ul>
      </div>
    )
  }
}

function mapStateToProps(state: AppState) {
  return {
    productLines: state.productLines,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    productLinesFetch: () => dispatch(productLinesActions.fetch()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ProductLineList)
