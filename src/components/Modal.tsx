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

const styles: any = require('./Modal.css')

import * as React from 'react'

interface Props {
  className?: string
  onDismiss(): void
  onInitialize(): void
}

export class Modal extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.handleKeyPress = this.handleKeyPress.bind(this)
  }

  componentDidMount() {
    if (typeof this.props.onInitialize === 'function') {
      this.props.onInitialize()
    }
    document.addEventListener('click', this.handleClick)
    document.addEventListener('keyup', this.handleKeyPress)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClick)
    document.removeEventListener('keyup', this.handleKeyPress)
  }

  render() {
    return (
      <div className={`${styles.root} ${this.props.className || ''}`}>
        {this.props.children}
      </div>
    )
  }

  private handleClick() {
    this.props.onDismiss()
  }

  private handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.props.onDismiss()
    }
  }
}
