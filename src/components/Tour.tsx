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
import Tour from 'react-user-tour'

const styles: any = require('./Tour.css')

export class UserTour extends React.Component<any, any> {
  constructor(props: any) {
    super(props)

    this.state = {
      isTourActive: false,
      tourStep: 1,
    }

    this.start = this.start.bind(this)
  }

  start() {
    this.setState({
      isTourActive: true,
      tourStep: 1,
    })
  }

  componentDidMount() {
    this.start()
  }

  render() {
    return (
      <div className={styles.container}>
        <Tour
          active={this.state.isTourActive}
          arrowColor="whitesmoke"
          arrowSize="12"
          buttonStyle={{
            backgroundColor: 'lightgrey',
            fontWeight: 'bold',
          }}
          className={styles.container}
          closeButtonText="&#10799;"
          containerStyle={{
            borderRadius: '6px',
            color: 'red',
          }}
          onBack={step => this.setState({tourStep: step})}
          onCancel={() => this.setState({isTourActive: false})}
          onNext={step => this.setState({tourStep: step})}
          step={this.state.tourStep}
          steps={[
            {
              step: 1,
              selector: '.Navigation-linkTour',
              title: <div className={styles.title}>Welcome</div>,
              body: <div className={styles.body}>
                Are you ready to take a quick tour of Beachfront?
              </div>,
            },
            {
              step: 2,
              selector: '.Navigation-linkTour',
              title: <div className={styles.title}>Wow!</div>,
              body: <div className={styles.body}>So good.</div>,
            },
          ]}
        />
      </div>
    )
  }
}
