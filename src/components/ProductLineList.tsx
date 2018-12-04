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

const styles = require('./ProductLineList.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {LoadingAnimation} from './LoadingAnimation'
import ProductLine from './ProductLine'
import {AppState} from '../store'
import {productLinesActions} from '../actions/productLinesActions'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type Props = StateProps & DispatchProps

export class ProductLineList extends React.Component<Props> {
  render() {
    const isEmpty = (
      !this.props.productLines.records.length &&
      !this.props.productLines.isFetching &&
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
              <button onClick={this.props.actions.productLines.fetch}>Retry</button>
            </li>
          )}
          {this.props.productLines.records.map(productLine => (
            <ProductLine
              className={styles.listItem}
              key={productLine.id}
              productLine={productLine}
            />
          ))}
          {isEmpty && (
            <li className={styles.placeholder}>No product lines currently exist</li>
          )}
          {this.props.productLines.isFetching && (
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
    actions: {
      productLines: {
        fetch: () => dispatch(productLinesActions.fetch()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(ProductLineList)
