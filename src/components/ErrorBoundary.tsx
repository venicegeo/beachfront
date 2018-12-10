/*
 * Copyright 2018, RadiantBlue Technologies, Inc.
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
 */

const styles: any = require('./ErrorBoundary.css')

import * as React from 'react'

type Info = {
  componentStack: string
}

type Props = {
  message?: string
}

type State = {
  hasError: boolean
  error: Error | null
  info: Info | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      info: null,
    }
  }

  componentDidCatch(error: Error, info: Info) {
    // You can also log the error to an error reporting service
    this.setState({
      hasError: true,
      error,
      info,
    })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // Error fallback UI.
    return (
      <div className={styles.root}>
        <div className={styles.section}>
          <h1>{this.props.message || 'Something broke.'}</h1>
        </div>

        <br/><br/>

        {this.state.error && (
          <div className={styles.section}>
            <h1 className={styles.header}>Uncaught Exception</h1>
            <h2>{this.state.error.stack}</h2>
          </div>
        )}

        <br/><br/>

        {this.state.info && (
          <div className={styles.section}>
            <h1 className={styles.header}>Component Stack</h1>
            <h2>{this.state.info.componentStack.trim()}</h2>
          </div>
        )}
      </div>
    )
  }
}
