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

const styles: any = require('./About.css')
const brand: string = require('../images/brand-small-square.svg')

import * as React from 'react'
import {connect} from 'react-redux'
import {Modal} from './Modal'
import {BrowsersSupported} from './BrowserSupport'
import {routeActions, RouteNavigateToArgs} from '../actions/routeActions'

type DispatchProps = ReturnType<typeof mapDispatchToProps>
type Props = DispatchProps

export class About extends React.Component<Props> {
  constructor(props: Props) {
    super(props)

    this.handleDismiss = this.handleDismiss.bind(this)
  }

  render() {
    return (
      <Modal className={styles.parent} onDismiss={this.handleDismiss} onInitialize={() => {/* noop */}}>
        <div className={styles.root}>
          <section className={styles.heading}>
            <img src={brand} alt="Beachfront"/>
            <h1>About Beachfront</h1>
          </section>
          <section className={styles.body}>
            <p>
              Beachfront is an NGA Services project aimed at providing automated
              near real time feature extraction of global shoreline captured at
              the best possible resolution based on available sources. Beachfront
              leverages computer vision algorithm services, the Piazza Platform,
              and incoming satellite imagery to provide this capability.
            </p>
          </section>
          <section className={styles.browserSupport}>
            <p>Beachfront will work best when used with a supported browser.</p>
            <BrowsersSupported/>
          </section>
        </div>
      </Modal>
    )
  }

  private handleDismiss() {
    this.props.actions.route.navigateTo({
      loc: {
        pathname: '/',
      },
    })
  }
}

function mapDispatchToProps(dispatch: Function) {
  return {
    actions: {
      route: {
        navigateTo: (args: RouteNavigateToArgs) => dispatch(routeActions.navigateTo(args)),
      },
    },
  }
}

export default connect<undefined, DispatchProps>(
  undefined,
  mapDispatchToProps,
)(About)
