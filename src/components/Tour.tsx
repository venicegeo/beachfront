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
  private bbox: number[]

  constructor(props: any) {
    super(props)

    this.bbox = [41.95, 11.12, 43.69, 12.22]

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
        selector: '.Navigation-linkHelp',
        hideArrow: true,
        horizontalOffset: 100,
        verticalOffset: -40,
        before() {
          this.props.application.navigateTo({ pathname: '/' })
        },
        title: <div className={styles.title}>View Area of Interest</div>,
        body: <div className={styles.body}>
          First, we need to pan to an area of interest.
          We&apos;ll use a section of Djibouti.
        </div>,
      },
      {
        step: 3,
        selector: '.Navigation-linkCreateJob',
        before() {
          this.props.application.panTo([
            (this.bbox[0] + this.bbox[2]) / 2,
            (this.bbox[1] + this.bbox[3]) / 2,
          ], 8)
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
          this.props.application.navigateTo({ pathname: '/create-job' })
        },
        title: <div className={styles.title}>Draw a Bounding Box</div>,
        body: <div className={styles.body}>
          Draw a bounding box around an area of interest to search for imagery.
          You click once to start the bounding box, then click again to end it.
          But we&apos;ll do it for you this time.
        </div>,
      },
      {
        step: 5,
        selector: '.CatalogSearchCriteria-source select',
        verticalOffset: -13,
        before() {
          let bbox = this.props.application.state.bbox

          if (!bbox || this.bbox.some((x, i) => x !== bbox[i])) {
            let nTotal = 20
            let n = 0

            let interval = setInterval(() => {
              ++n

              this.props.application.setState({
                bbox: [
                  this.bbox[0],
                  this.bbox[1],
                  this.bbox[0] + n / nTotal * (this.bbox[2] - this.bbox[0]),
                  this.bbox[1] + n / nTotal * (this.bbox[3] - this.bbox[1]),
                ],
              })

              if (n >= nTotal) {
                clearInterval(interval)

                this.props.application.setState({ bbox: this.bbox })
              }
            }, 50)
          }

          this.props.application.state.bbox = this.bbox
          this.props.application.navigateTo({ pathname: '/create-job' })
        },
        title: <div className={styles.title}>Select the Imagery Source</div>,
        body: <div className={styles.body}>
          Select the imagery source.  We&apos;ll use Sentinel-2 for now.
        </div>,
      },
      {
        step: 6,
        selector: '.CatalogSearchCriteria-apiKey input',
        verticalOffset: -13,
        before() {
          this.props.application.setState({
            searchCriteria: Object.assign({}, this.props.application.state.searchCriteria, {
              source: 'sentinel',
            }),
          })
        },
        title: <div className={styles.title}>Enter the API Key</div>,
        body: <div className={styles.body}>
          Enter the API key.
        </div>,
        // TODO:  What am I going to do about this?
      },
      {
        step: 7,
        selector: '.CatalogSearchCriteria-captureDateFrom input',
        before() {
          // Do nothing.
        },
        title: <div className={styles.title}>Enter the Date Range</div>,
        body: <div className={styles.body}>
          Enter the date range that will be used to search for imagery.
          By default the last 30 days is searched, but your needs may vary.
        </div>,
      },
      {
        step: 8,
        selector: '.CatalogSearchCriteria-cloudCover input',
        horizontalOffset: 40,
        verticalOffset: -13,
        before() {
          this.props.application.setState({
            searchCriteria: Object.assign({}, this.props.application.state.searchCriteria, {
              dateFrom: '2017-09-01',
              dateTo: '2017-09-30',
            }),
          })
        },
        title: <div className={styles.title}>Select the Acceptable Cloud Cover</div>,
        body: <div className={styles.body}>
          Adjust the amount of cloud cover that you are willing to tolerate.
        </div>,
      },
      {
        step: 9,
        selector: '.ImagerySearch-controls button',
        verticalOffset: -13,
        before() {
          this.props.application.setState({
            searchCriteria: Object.assign({}, this.props.application.state.searchCriteria, {
              cloudCover: 8,
            }),
          })
          this.props.application.navigateTo({ pathname: '/create-job' })
        },
        title: <div className={styles.title}>Search for Imagery</div>,
        body: <div className={styles.body}>
          Just click the button to submit the job.
        </div>,
      },
      {
        step: 10,
        selector: '.ImagerySearch-loadingAnimation .LoadingAnimation-root',
        hideArrow: true,
        before() {
          let button: any = document.querySelector('.ImagerySearch-controls button')
          button.click()

          let buttons: any = document.querySelector('.react-user-tour-button-container')
          buttons.style.visibility = 'hidden'

          let interval = setInterval(() => {
            if (!document.querySelector('.ImagerySearch-loadingAnimation .LoadingAnimation-root')) {
              clearInterval(interval)
              buttons.style.visibility = 'visible'
            }
          }, 1000)
        },
        title: <div className={styles.title}>Waiting for Imagery</div>,
        body: <div className={styles.body}>
          Waiting for imagery&hellip;
        </div>,
      },
      {
        step: 11,
        selector: '.CatalogSearchCriteria-root',
        title: <div className={styles.title}>Display Imagery</div>,
        body: <div className={styles.body}>
          Click in one of the polygons to load the image.
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

  componentDidUpdate() {
    // Do nothing.
  }

  componentWillUpdate(_: any, nextState: any) {
    if (this.state.isTourActive && nextState.isTourActive) {
      let step = this.steps.find(i => i.step === this.state.tourStep)

      if (step.after) {
        step.after.apply(this)
      }
    }
  }

  start() {
    this.showArrow(false)

    if (!this.state.isTourActive) {
      this.setState({
        isTourActive: true,
        tourStep: 1,
      })
    }
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
    let arrow: any = document.querySelector('.react-user-tour-arrow')

    if (arrow) {
      arrow.style.visibility = show ? 'visible' : 'hidden'
    }
  }

  private gotoStep(n) {
    let step = this.steps.find(i => i.step === n)

    this.showArrow(!step.hideArrow)

    if (step.before) {
      step.before.apply(this)
    }

    this.setState({
      tourStep: n,
    })
  }
}
