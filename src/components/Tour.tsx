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
import {TYPE_SCENE} from '../constants'
import Tour from 'react-user-tour'
import {createSearchCriteria} from './CreateJob'
import {TOUR} from '../config'

const styles: any = require('./Tour.css')

const Arrow = ({ position }) => {
  const classnames = {
    bottom: 'arrow-up',
    bottomLeft: 'arrow-up',
    left: 'arrow-right',
    right: 'arrow-left',
    top: 'arrow-down',
    topLeft: 'arrow-down',
  }

  return <div className={`${styles.arrow} ${styles[classnames[position]]}`}/>
}

const ImageCount = (props: any) => {
  return <strong> {props.tour.imageCount} </strong>
}

const SourceName = (props: any) => {
  return <q>{props.tour.sourceName}</q>
}

class JobStatus extends React.Component<any, any> {
  private interval: number
  private app: any

  constructor(props: any) {
    super(props)

    this.app = this.props.tour.props.application
    this.state = { status: null }
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      let jobs = this.app.state.jobs.records
      let job = jobs[jobs.length - 1]

      if (job && this.state.status !== job.properties.status) {
        this.setState({ status: job.properties.status })
      }

      if (/success/i.test(this.state.status)) {
        clearInterval(this.interval)
      }
    }, 250)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <span className={styles.status}>{this.state.status}</span>
    )
  }
}

export class UserTour extends React.Component<any, any> {
  private basemap: string
  private bbox: [number, number, number, number]
  private bboxName: string
  private searchCriteria: any
  private steps: any[]
  private zoom: number

  constructor(props: any) {
    super(props)

    this.basemap = TOUR.basemap
    this.bbox = TOUR.bbox as [number, number, number, number]
    this.bboxName = TOUR.bboxName
    this.searchCriteria = TOUR.searchCriteria
    this.zoom = TOUR.zoom

    this.state = {
      changing: false,
      isTourActive: false,
      tourStep: 1,
    }

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
        selector: '.BasemapSelect-root',
        position: 'left',
        title: <div className={styles.title}>Select a Basemap</div>,
        body: <div className={styles.body}>
          You may choose a basemap here.  We&apos;ll use {this.basemap}.
        </div>,
        async before() {
          if (!this.query('.BasemapSelect-root.BasemapSelect-isOpen')) {
            this.query('.BasemapSelect-button').click()
          }
        },
        async after() {
          let basemaps: any = document.querySelectorAll('.BasemapSelect-options li')

          basemaps.forEach(basemap => {
            if (basemap.textContent === this.basemap) {
              basemap.click()
            }
          })
        },
      },
      {
        step: 3,
        selector: '.Navigation-brand',
        hideArrow: true,
        horizontalOffset: 160,
        verticalOffset: 60,
        title: <div className={styles.title}>View Area of Interest</div>,
        body: <div className={styles.body}>
          Then we need to pan to an area of interest.
          We&apos;ll look at {this.bboxName}.
        </div>,
        before() {
          return this.navigateTo('/')
        },
        after() {
          let app = this.props.application
          let searchCriteria = createSearchCriteria()

          app.setState({ searchCriteria })
          sessionStorage.setItem('searchCriteria', JSON.stringify(searchCriteria))

          return this.navigateTo('/').then(() => {
            // Pan to the center of the bound box that we will highlight later.
            app.panTo([
              (this.bbox[0] + this.bbox[2]) / 2,
              (this.bbox[1] + this.bbox[3]) / 2,
            ], this.zoom)
          })
        },
      },
      {
        step: 4,
        selector: '.Navigation-linkCreateJob',
        title: <div className={styles.title}>Create a Job</div>,
        verticalOffset: 50,
        body: <div className={styles.body}>
          Now we need to create a job.
        </div>,
      },
      {
        step: 5,
        selector: '.CreateJob-placeholder h3',
        horizontalOffset: -30,
        title: <div className={styles.title}>Draw a Bounding Box</div>,
        body: <div className={styles.body}>
          Draw a bounding box around an area of interest to search for imagery.
          You click once to start the bounding box, then click again to end it.
          But we&apos;ll do it for you this time.
        </div>,
        before() {
          this.props.application.handleClearBbox()
          return this.navigateTo('/create-job')
        },
        after() {
          this.showArrow(false)

          return new Promise(resolve => {
            let app = this.props.application
            let bbox = app.state.bbox

            if (!bbox || this.bbox.some((x, i) => x !== bbox[i])) {
              let duration = 1000, i = 0, n = 20, interval = setInterval(() => {
                ++i

                app.setState({
                  bbox: [
                    this.bbox[0],
                    this.bbox[1],
                    this.bbox[0] + i / n * (this.bbox[2] - this.bbox[0]),
                    this.bbox[1] + i / n * (this.bbox[3] - this.bbox[1]),
                  ],
                })

                if (i >= n) {
                  clearInterval(interval)
                  app.setState({ bbox: this.bbox })
                  resolve()
                }
              }, duration / n)
            }

            app.setState({ bbox: this.bbox })
          })
        },
      },
      {
        step: 6,
        selector: '.CatalogSearchCriteria-source select',
        verticalOffset: -13,
        title: <div className={styles.title}>Select the Imagery Source</div>,
        body: <div className={styles.body}>
          Select the imagery source.  We&apos;ll use <SourceName tour={this}/> for now.
        </div>,
        async after() {
          let app = this.props.application

          if (app.state.searchCriteria.source !== this.searchCriteria.source) {
            app.setState({
              searchCriteria: Object.assign({}, app.state.searchCriteria, {
                source: this.searchCriteria.source,
              }),
            })
          }
        },
      },
      {
        step: 7,
        selector: '.CatalogSearchCriteria-apiKey input',
        verticalOffset: -13,
        title: <div className={styles.title}>Enter the API Key</div>,
        body: <div className={styles.body}>
          Enter the API key.
        </div>,
        // TODO:  What am I going to do about this?
      },
      {
        step: 8,
        selector: '.CatalogSearchCriteria-captureDateFrom input',
        title: <div className={styles.title}>Enter the Date Range</div>,
        body: <div className={styles.body}>
          Enter the date range that will be used to search for imagery.
          By default the last 30 days is searched, but your needs may vary.
        </div>,
        after() {
          return new Promise(resolve => {
            let app = this.props.application
            let search = this.searchCriteria
            let fromElem = this.query('.CatalogSearchCriteria-captureDateFrom input')
            let $from = fromElem && fromElem.value !== search.dateFrom
              ? this.pace(search.dateFrom, (_, s) => fromElem.value = s)
              : Promise.resolve()

            $from.then(() => {
              app.setState({
                searchCriteria: Object.assign({}, app.state.searchCriteria, {
                  dateFrom: search.dateFrom,
                }),
              })

              let toElem = this.query('.CatalogSearchCriteria-captureDateTo input')
              let $to = toElem && toElem.value !== search.dateTo
                ? this.pace(search.dateTo, (_, s) => toElem.value = s)
                : Promise.resolve()

              $to.then(() => {
                app.setState({
                  searchCriteria: Object.assign({}, app.state.searchCriteria, {
                    dateTo: search.dateTo,
                  }),
                })

                resolve()
              })
            })
          })
        },
      },
      {
        step: 9,
        selector: '.CatalogSearchCriteria-cloudCover input',
        horizontalOffset: 40,
        verticalOffset: -13,
        title: <div className={styles.title}>Select the Acceptable Cloud Cover</div>,
        body: <div className={styles.body}>
          Adjust the amount of cloud cover that you are willing to tolerate.
        </div>,
        after() {
          return new Promise(resolve => {
            let app = this.props.application

            function* gen(from, to) {
              let sign = Math.sign(to - from)

              for (let i = from + sign; Math.abs(to - i); i += sign) {
                yield i
              }

              yield to
            }

            if (app.state.searchCriteria.cloudCover === this.searchCriteria.cloudCover) {
              resolve()
            } else {
              let fn = (g) => {
                let i = g.next()

                if (i.done) {
                  setTimeout(resolve, 100)
                } else {
                  setTimeout(() => {
                    app.setState({
                      searchCriteria: Object.assign({}, app.state.searchCriteria, {
                        cloudCover: i.value,
                      }),
                    })

                    fn(g)
                  }, 250)
                }
              }

              fn(gen(app.state.searchCriteria.cloudCover, this.searchCriteria.cloudCover))
            }
          })
        },
      },
      {
        step: 10,
        selector: '.ImagerySearch-controls button',
        verticalOffset: -13,
        title: <div className={styles.title}>Search for Imagery</div>,
        body: <div className={styles.body}>
          Just click the button to submit the job.
        </div>,
        async after() {
          if (!this.props.application.state.searchResults) {
            this.query('.ImagerySearch-controls button').click()
            this.showArrow(false)
          }
        },
      },
      {
        step: 11,
        selector: '.ImagerySearchResults-pager',
        hideArrow: true,
        title: <div className={styles.title}>Imagery Results</div>,
        body: <div className={styles.body}>
          Here are outlines of the <ImageCount tour={this}/>
          matching the search criteria.  Click on one to load the image
          itself&hellip; We&apos;ll select one for you for now.
        </div>,
        before() {
          return new Promise(resolve => {
            let interval = setInterval(() => {
              if (this.props.application.state.searchResults) {
                clearInterval(interval)
                resolve()
              }
            }, 100)
          })
        },
        after() {
          return new Promise(resolve => {
            let app = this.props.application

            // Get the feature with the least amount of cloud cover.
            let feature = app.state.searchResults.images.features.filter(f => {
              // Eliminate 0 cloud cover, that may mean a bad image.
              return f.properties.cloudCover
            }).sort((a, b) => {
              return a.properties.cloudCover - b.properties.cloudCover
            }).shift()

            /*
            Manually setting this 'type' here is a hack to force the
            FeatureDetails to render.  I'm not sure how this gets set to
            the correct value in the normal course of events.
            */
            feature.properties.type = TYPE_SCENE
            app.handleSelectFeature(feature)
            app.setState({ selectedFeature: feature })
            setTimeout(resolve, 100)
          })
        },
      },
      {
        step: 12,
        selector: '.FeatureDetails-root',
        position: 'left',
        horizontalOffset: 15,
        verticalOffset: 50,
        title: <div className={styles.title}>Image Details</div>,
        body: <div className={styles.body}>
          Here are the details for the selected image.
        </div>,
      },
      {
        step: 13,
        selector: '.AlgorithmList-root',
        position: 'right',
        horizontalOffset: 8,
        verticalOffset: -10,
        title: <div className={styles.title}>Compatible Algorithms</div>,
        body: <div className={styles.body}>
          Here is a list of algorithms that are compatible with the selected image.
        </div>,
      },
      {
        step: 14,
        selector: '.AlgorithmList-root li:last-child .Algorithm-startButton',
        position: 'top',
        title: <div className={styles.title}>Select an Algorithm</div>,
        body: <div className={styles.body}>
          We&apos;ll use this one.
        </div>,
        after() {
          this.query('.AlgorithmList-root li:last-child .Algorithm-startButton').click()

          return new Promise(resolve => {
            let app = this.props.application, interval = setInterval(() => {
              if (app.state.route.pathname === '/jobs') {
                clearInterval(interval)
                resolve()
              }
            }, 250)
          })
        },
      },
      {
        step: 15,
        selector: '.JobStatusList-root .JobStatus-root:last-child',
        verticalOffset: -8,
        title: <div className={styles.title}>Job Status</div>,
        body: <div className={styles.body}>
          Here is the job you just submitted.
          Currently its status is <JobStatus tour={this}/>.
          On the map you will see the job and its status as well.
          Click on the job in the list to see more details.
        </div>,
        after() {
          return new Promise(resolve => {
            let elem = this.query('.JobStatusList-root .JobStatus-root:last-child')

            if (!elem || Array.from(elem.classList).find(n => n === 'JobStatus-isExpanded')) {
              resolve()
            } else {
              elem.querySelector('.JobStatus-details').click()
              setTimeout(resolve, 250)
            }
          })
        },
      },
      {
        step: 16,
        selector: '.JobStatusList-root .JobStatus-root:last-child .JobStatus-metadata',
        position: 'right',
        title: <div className={styles.title}>Job Details</div>,
        body: <div className={styles.body}>
          The details will give you information about the job and its imagery.
        </div>,
      },
      {
        step: 17,
        selector: '.JobStatusList-root .JobStatus-root:last-child .JobStatus-controls a',
        position: 'right',
        verticalOffset: 18,
        title: <div className={styles.title}>View Job on Map</div>,
        body: <div className={styles.body}>
          Click on the globe link to display this job on the map.
        </div>,
        async after() {
          this.query('.JobStatusList-root .JobStatus-root:last-child .JobStatus-controls a').click()
        },
      },
      {
        step: 18,
        selector: '.ol-mouse-position',
        horizontalOffset: 32,
        verticalOffset: -32,
        hideArrow: true,
        title: <div className={styles.title}>Job on Map</div>,
        body: <div className={styles.body}>
          Here we are zoomed in on the job.
          Once the job has run successfully then you can use other links in the
          job list to download it as GeoJSON or GPKG.
        </div>,
      },
      {
        step: 19,
        selector: '.ol-scale-line',
        horizontalOffset: 120,
        verticalOffset: -200,
        hideArrow: true,
        title: <div className={styles.title}>That&apos;s All Folks</div>,
        body: <div className={styles.body}>
          Go home.
        </div>,
      },
    ]

    this.gotoStep = this.gotoStep.bind(this)
    this.isElementInViewport = this.isElementInViewport.bind(this)
    this.navigateTo = this.navigateTo.bind(this)
    this.pace = this.pace.bind(this)
    this.query = this.query.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)
    this.showArrow = this.showArrow.bind(this)
    this.start = this.start.bind(this)
  }

  componentDidMount() {
    this.start()
  }

  start() {
    this.showArrow(false)

    if (!this.state.isTourActive) {
      this.setState({
        changing: false,
        isTourActive: true,
        tourStep: 1,
      })
    }
  }

  render() {
    return (
      <Tour
        active={this.state.isTourActive}
        arrow={Arrow}
        buttonStyle={{}}
        className={styles.root}
        closeButtonText="&#10799;"
        onBack={step => this.gotoStep(step)}
        onCancel={() => this.setState({ changing: false, isTourActive: false })}
        onNext={step => this.gotoStep(step)}
        ref="tour"
        step={this.state.tourStep}
        steps={this.steps}
      />
    )
  }

  private gotoStep(n) {
    if (this.state.changing) {
      return Promise.resolve()
    }

    this.state.changing = true
    return new Promise(resolve => {
      let lastStep = this.steps.find(i => i.step === this.state.tourStep)
      let $after = lastStep && lastStep.after ? lastStep.after.apply(this) : Promise.resolve()

      $after.then(() => {
        let nextStep = this.steps.find(i => i.step === n)
        let $before = nextStep && nextStep.before ? nextStep.before.apply(this) : Promise.resolve()

        $before.then(() => {
          this.scrollIntoView(nextStep.selector).then(() => {
            this.showArrow(!nextStep.hideArrow)
            this.setState({
              changing: false,
              tourStep: n,
            })
            resolve()
          }).catch(() => {
            this.setState({ changing: false })
          })
        })
      })
    })
  }

  private isElementInViewport(elem): boolean {
    let box = elem.getBoundingClientRect()

    return box.top >= 0
      && box.left >= 0
      && box.bottom <= (window.innerHeight || document.documentElement.clientHeight)
      && box.right <= (window.innerWidth || document.documentElement.clientWidth)
  }

  private navigateTo(pathname): Promise<any> {
    let app = this.props.application

    if (pathname === app.state.route.pathname) {
      return Promise.resolve(pathname)
    } else {
      return new Promise(resolve => {
        app.navigateTo({ pathname: pathname })

        let interval = setInterval(() => {
          if (pathname === app.state.route.pathname) {
            clearInterval(interval)
            resolve(pathname)
          }
        }, 10)
      })
    }
  }

  private pace(text, cb, delay = 100): Promise<string> {
    return new Promise(resolve => {
      let i = 0, interval = setInterval(() => {
        if (i < text.length) {
          cb(text.charAt(i), text.substring(0, ++i))
        } else {
          clearInterval(interval)
          resolve(text)
        }
      }, delay)
    })
  }

  private query(selector: string): any {
    return document.querySelector(selector)
  }

  private scrollIntoView(selector: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let elem = typeof selector === 'string' ? this.query(selector) : selector

      if (elem) {
        if (this.isElementInViewport(elem)) {
          resolve()
        } else {
          elem.scrollIntoView({ behavior: 'smooth' })

          let interval = setInterval(() => {
            if (this.isElementInViewport(elem)) {
              clearInterval(interval)
              setTimeout(resolve, 100)
            }
          }, 100)
        }
      } else {
        let message = `The DOM element, "${selector}", is not available.`
        console.log(message)
        reject(message)
      }
    })
  }

  private showArrow(show: boolean): void {
    let arrow = this.query(`.${styles.arrow}`)

    if (arrow) {
      arrow.style.visibility = show ? 'visible' : 'hidden'
    }
  }

  private get imageCount(): string {
    let results = this.props.application.state.searchResults

    switch (results && results.count) {
      case null:
      case undefined:
        return 'images'
      case 1:
        return 'one image'
      default:
        return `${results.count} images`
    }
  }

  private get jobStatus(): string {
    let jobs = this.props.application.state.jobs
    let job = jobs && jobs.records && jobs.records[jobs.records.length - 1]

    return job && job.properties && job.properties.status || 'Unknown'
  }

  private get sourceName() {
    let options = document.querySelectorAll('.CatalogSearchCriteria-source select option')
    let option: any = options && Array.from(options).find((o: any) => {
      return o.value === this.searchCriteria.source
    })

    return option && option.text
  }
}
