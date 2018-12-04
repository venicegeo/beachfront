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

const styles: any = require('./Timestamp.css')

import * as React from 'react'
import * as moment from 'moment'

const INTERVAL = 15000

interface Props {
  className?: string
  timestamp: Date|string|number
}

interface State {
  relative: boolean
}

export class Timestamp extends React.Component<Props, State> {
  private _timer: any

  constructor(props: Props) {
    super(props)
    this.state = {relative: true}
    this.handleClick = this.handleClick.bind(this)
  }

  componentDidMount() {
    this._timer = setInterval(() => this.forceUpdate(), INTERVAL)
  }

  componentWillUnmount() {
    clearInterval(this._timer)
  }

  render() {
    const t = moment.utc(this.props.timestamp)
    const relativeTimestamp = t.fromNow()
    const staticTimestamp   = t.local().format('llll')
    return (
      <span className={`${styles.root} ${this.props.className}`}
            title={this.state.relative ? staticTimestamp : relativeTimestamp}
            onClick={this.handleClick}>
        {this.state.relative ? relativeTimestamp : staticTimestamp}
      </span>
    )
  }

  private handleClick(event) {
    event.stopPropagation()
    event.preventDefault()
    this.setState({relative: !this.state.relative})
  }
}
