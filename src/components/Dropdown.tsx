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

const styles: any = require('./Dropdown.css')

import * as React from 'react'

interface Props {
  className?: string
  options: {value: string, label: string}[]
  value: string
  onChange(value: string): void
}

interface State {
  isOpen?: boolean
}

export class Dropdown extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {isOpen: false}
    this.handleToggleOpen = this.handleToggleOpen.bind(this)
    this.handleExternalClick = this.handleExternalClick.bind(this)
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.isOpen !== prevState.isOpen) {
      if (this.state.isOpen) {
        this.attachClickInterceptor()
      } else {
        this.detachClickInterceptor()
      }
    }
  }

  componentWillUnmount() {
    this.detachClickInterceptor()
  }

  render() {
    const {options, className, value} = this.props
    const current = options.find(o => o.value === value)
    return (
      <div className={`${styles.root} ${className || ''} ${this.state.isOpen ? styles.isOpen : ''}`}>
        <div className={styles.button} onClick={this.handleToggleOpen}>
          {current ? current.label : '???'}
          <i className="fa fa-caret-down"/>
        </div>

        <ul className={styles.options}>
          {options.map(option => (
            <li
              key={option.label + option.value}
              className={current === option ? styles.active : ''}
              onClick={() => this.handleChange(option.value)}
            >{option.label}</li>
          ))}
        </ul>
      </div>
    )
  }

  private attachClickInterceptor() {
    document.addEventListener('click', this.handleExternalClick)
  }

  private detachClickInterceptor() {
    document.removeEventListener('click', this.handleExternalClick)
  }

  private handleChange(value) {
    this.props.onChange(value)
    this.setState({ isOpen: false })
  }

  private handleExternalClick() {
    this.setState({ isOpen: false })
    this.detachClickInterceptor()
  }

  private handleToggleOpen() {
    this.setState({ isOpen: !this.state.isOpen })
  }
}
