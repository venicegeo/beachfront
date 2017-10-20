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
  private steps: any[]

  constructor(props: any) {
    super(props)

    this.steps = [
      {
        step: 1,
        selector: '.Navigation-linkTour',
        hideArrow: true,
        title: <div className={styles.title}>Welcome</div>,
        body: <div className={styles.body}>
          Are you ready to take a quick tour of Beachfront?
        </div>,
      },
      {
        step: 2,
        selector: '.ol-zoomslider',
        hideArrow: true,
        horizontalOffset: -100,
        before() {
          let link: any = document.querySelector('.Navigation-linkHome')

          if (link) {
            link.click()
          }
        },
        title: <div className={styles.title}>View Area of Interest</div>,
        body: <div className={styles.body}>
          First, we need to pan to an area of interest.
          We&apos;ll use a section of Manzanillo, Colima, Mexico.
        </div>,
      },
      {
        step: 3,
        selector: '.Navigation-linkCreateJob',
        before() {
          this.props.application.panTo([-104.366523, 19.119182])
        },
        title: <div className={styles.title}>Create a Job</div>,
        body: <div className={styles.body}>
          Now we need to create a job.
        </div>,
      },
      {
        step: 4,
        selector: '.CreateJob-placeholder h3',
        horizontalOffset: -30,
        before() {
          let link: any = document.querySelector('.Navigation-linkCreateJob')

          if (link) {
            link.click()
          }
        },
        title: <div className={styles.title}>Draw a Bounding Box</div>,
        body: <div className={styles.body}>
          Draw a bounding box around an area of interest to search for imagery.
        </div>,
      },
    ]

    this.state = {
      isTourActive: false,
      tourStep: 1,
    }

    this.start = this.start.bind(this)
    this.gotoStep = this.gotoStep.bind(this)
    this.showArrow = this.showArrow.bind(this)
  }

  componentDidMount() {
    this.start()
  }

  start() {
    this.showArrow(false)

    this.setState({
      isTourActive: true,
      tourStep: 1,
    })
  }

  gotoStep(n) {
    let step = this.steps.find(i => i.step === n)

    this.showArrow(!step.hideArrow)

    if (step.before) {
      step.before.apply(this)
    }

    this.setState({
      tourStep: n,
    })
  }

  render() {
    return (
      <Tour
        active={this.state.isTourActive}
        arrowColor="whitesmoke"
        arrowSize="12"
        buttonStyle={{}}
        className={styles.root}
        closeButtonText="&#10799;"
        onBack={step => this.gotoStep(step)}
        onCancel={() => this.setState({isTourActive: false})}
        onNext={step => this.gotoStep(step)}
        step={this.state.tourStep}
        steps={this.steps}
      />
    )
  }

  private showArrow(show: boolean) {
    let arrow: any = document.querySelector('#UserTour .react-user-tour-arrow')

    if (arrow) {
      arrow.style.visibility = show ? 'visible' : 'hidden'
    }
  }
}
