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

import * as React from 'react'
import * as MAP from 'lodash/map'
import {SUPPORTED_BROWSERS} from '../config'

const styles: any = require('./BrowserSupport.css')
const {detect} = require('detect-browser')

function getState() {
  let rc: any = {
    browser: detect(),
    supported: false,
    hide: JSON.parse(sessionStorage.getItem('dismissBrowserSupport')),
  }

  if (rc.browser) {
    let version = SUPPORTED_BROWSERS[rc.browser.name]
    rc.supported = version && parseInt(rc.browser.version) >= version
  }

  return rc
}

function nameAndVersion(name, version) {
  return `${name.charAt(0).toUpperCase()}${name.substring(1)} ${version}`
}

export class BrowserSupport extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = getState()
    this.browserVersion = this.browserVersion.bind(this)
    this.dismiss = this.dismiss.bind(this)
  }

  render() {
    if (this.state.supported || this.state.hide) {
      return null
    }

    return (
      <div className={styles.root}>
        <div
          className={styles.close}
          title="Dismiss"
          onClick={this.dismiss}
        >&times;</div>

        <div className={styles.message}>
          Your browser, {this.browserVersion()}, is not supported at this time.
        </div>

        <div className={styles.supported}>
          <div>Supported browsers include:</div>
          <ul>
            {
              MAP(SUPPORTED_BROWSERS, (version, name) => (
                <li key={name}>{nameAndVersion(name, version)} and higher</li>
              ))
            }
          </ul>
        </div>
      </div>
    )
  }

  private browserVersion(browser = this.state.browser): string {
    return browser
      ? nameAndVersion(browser.name, browser.version)
      : 'which we could not identify'
  }

  private dismiss() {
    this.setState({ hide: true })
    sessionStorage.setItem('dismissBrowserSupport', 'true')
  }
}
