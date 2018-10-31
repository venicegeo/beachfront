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

const styles: any = require('./BasemapSelect.css')

import * as React from 'react'

interface Props {
  basemaps: string[]
  className: string
  index: number
  onChange(index: number)
}

interface State {
  isOpen: boolean
}

export class BasemapSelect extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state            = {isOpen: false}
    this.handleToggleOpen = this.handleToggleOpen.bind(this)
  }

  render() {
    const {basemaps, className, index} = this.props
    const current = basemaps[index]
    return (
      <div className={`${styles.root} ${className || ''} ${this.state.isOpen ? styles.isOpen : ''}`}>
        <div className={styles.button} onClick={this.handleToggleOpen}>
          <label>
            <svg viewBox="0 0 40 33">
              <polygon points="36.4644661 17.3228873 40 19.5276993 20 32 0 19.5276993 3.53553391 17.3228873 20 27.5903758 36.4644661 17.3228873"/>
              <polygon points="40 12.4723007 20 24.9446013 0 12.4723007 20 0"/>
            </svg>
            {current}
          </label>
          <span><i className="fa fa-caret-down"/></span>
        </div>
        <ul className={styles.options}>
          {basemaps.map((basemap, i) => (
            <li key={i}
                className={index === i ? styles.active : ''}
                onClick={() => this.handleChange(i)}>{basemap}</li>
          ))}
        </ul>
      </div>
    )
  }

  private handleChange(index) {
    this.props.onChange(index)
    this.setState({isOpen: false})
  }

  private handleToggleOpen() {
    this.setState({isOpen: !this.state.isOpen})
  }
}
