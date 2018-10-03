/**
 * Copyright 2017, Radiant Solutions
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

const UserTourErrorMessage = (props: any) => {
  return props.message ? <div className={styles.error}>
    <div className={styles.close} title="Dismiss" onClick={props.tour.cancel}>&times;</div>
    <div className={styles.header}>Oops!</div>
    <div className={styles.message}>{props.message}</div>
  </div> : null
}

export class UserTour extends React.Component<any, any> {
  private algorithm: string
  private apiKeyInstructions: any
  private basemap: string
  private bbox: [number, number, number, number]
  private bboxName: string
  private searchCriteria: any
  private steps: any[]
  private zoom: number

  constructor(props: any) {
    super(props)

    this.algorithm = TOUR.algorithm
    this.apiKeyInstructions = <div dangerouslySetInnerHTML={{ __html: TOUR.apiKeyInstructions }}/>
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
        position: 'right',
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
        selector: '.Navigation-linkCreateJob svg g',
        verticalOffset: -14,
        title: <div className={styles.title}>Create a Job</div>,
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
        verticalOffset: -14,
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
          <div className={styles.getApiKey}>
            If you don&apos;t yet have an API key then you&apos;ll have to
            close this tour until you&apos;re able to obtain one.
          </div>
          <div>
            <label className={styles.apiKey}>
              <span>Enter your API key&hellip;</span>
              <input defaultValue={localStorage.getItem('catalog_apiKey')} type="password"/>
            </label>
          </div>
          {this.apiKeyInstructions}
        </div>,
        async after() {
          let input = this.query(`.${styles.apiKey} input`)

          this.props.application.setState({
            catalogApiKey: input.value,
          })
        },
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
        position: 'top',
        title: <div className={styles.title}>Select the Acceptable Cloud Cover</div>,
        body: <div className={styles.body}>
          Adjust the amount of cloud cover that you are willing to tolerate.
        </div>,
        after() {
          return new Promise(resolve => {
            let app = this.props.application

            function gen(from, to): number[] {
              const rc: number[] = []
              const sign = Math.sign(to - from)

              for (let i = from + sign; Math.abs(to - i); i += sign) {
                rc.unshift(i)
              }

              rc.unshift(to)

              return rc
            }

            if (app.state.searchCriteria.cloudCover === this.searchCriteria.cloudCover) {
              resolve()
            } else {
              let fn = (g) => {
                const i = g.pop()

                if (i == null) {
                  setTimeout(resolve, 100)
                } else {
                  setTimeout(() => {
                    app.setState({
                      searchCriteria: Object.assign({}, app.state.searchCriteria, {
                        cloudCover: i,
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
        selector: '.ImagerySearch-controls button[type=submit]',
        position: 'top',
        verticalOffset: 21,
        title: <div className={styles.title}>Search for Imagery</div>,
        body: <div className={styles.body}>
          Just click the button to perform the search.
        </div>,
        after() {
          if (this.props.application.state.searchResults) {
            return Promise.resolve()
          } else {
            this.query('.ImagerySearch-controls button[type=submit]').click()
            this.showArrow(false)

            return new Promise((resolve, reject) => {
              const timeout = 60000
              const t0 = Date.now()
              const app = this.props.application
              const interval = setInterval(() => {
                if (app.state.searchResults) {
                  clearInterval(interval)
                  resolve()
                } else if (Date.now() - t0 > timeout) {
                  clearInterval(interval)
                  reject(`Timed out after ${timeout / 1000} seconds waiting for imagery results.`)
                } else {
                  const elem = this.query('.ImagerySearch-errorMessage')

                  if (elem) {
                    const m = elem.querySelector('h4')

                    clearInterval(interval)
                    reject(m && m.textContent || 'Oops!')
                  }
                }
              }, 250)
            })
          }
        },
      },
      {
        step: 11,
        selector: '.ImagerySearchResults-root',
        hideArrow: true,
        title: <div className={styles.title}>Imagery Results</div>,
        body: <div className={styles.body}>
          Here are outlines of the <ImageCount tour={this}/>
          matching the search criteria.  Click on one to load the image
          itself&hellip; For now, we&apos;ll select one for you.
        </div>,
        after() {
          return new Promise(resolve => {
            let app = this.props.application

            // Get the feature with the least amount of cloud cover.
            let feature = app.state.searchResults.images.features.filter(f => {
              // Eliminate images w/ zero cloud cover; that may mean a bad image.
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
        selector: '.AlgorithmList-root h2',
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
        selector: `.AlgorithmList-root li${this.algorithm} .Algorithm-startButton`,
        position: 'top',
        verticalOffset: 16,
        title: <div className={styles.title}>Select an Algorithm</div>,
        body: <div className={styles.body}>
          We&apos;ll use this one.
        </div>,
        after() {
          const algorithm = this.query(`.AlgorithmList-root li${this.algorithm}`)
          algorithm.querySelector('.Algorithm-startButton').click()

          return new Promise((resolve, reject) => {
            const timeout = 30000
            const t0 = Date.now()
            const app = this.props.application
            const interval = setInterval(() => {
              if (app.state.route.pathname === '/jobs') {
                clearInterval(interval)
                resolve()
              } else if (Date.now() - t0 > timeout) {
                clearInterval(interval)
                reject(`Timed out after ${timeout / 1000} seconds waiting for /jobs.`)
              } else {
                const elem = algorithm.querySelector('.AlgorithmList-errorMessage')

                if (elem) {
                  let m = elem.querySelector('h4')

                  clearInterval(interval)
                  reject(m && m.textContent || 'Oops!')
                }
              }
            }, 250)
          })
        },
      },
      {
        step: 15,
        selector: `.JobStatusList-root .JobStatus-root.JobStatus-isActive`,
        verticalOffset: -8,
        title: <div className={styles.title}>Job Status</div>,
        body: <div className={styles.body}>
          Here is the job you just submitted.
          On the map you will see the job and its status as well.
          Click on the job in the list to see more details.
        </div>,
      },
      {
        step: 16,
        selector: '.JobStatusList-root .JobStatus-isActive .JobStatus-metadata',
        position: 'top',
        verticalOffset: 20,
        title: <div className={styles.title}>Job Details</div>,
        body: <div className={styles.body}>
          The details will give you information about the job and its imagery.
        </div>,
        before() {
          return this.expandJobStatus().then(() => {
            const elem = this.query('.JobStatusList-root .JobStatus-isActive')

            if (!elem.classList.contains('JobStatus-isExpanded')) {
              elem.querySelector('.JobStatus-details').click()
            }
          })
        },
      },
      {
        step: 17,
        selector: `.JobStatusList-root .JobStatus-isActive .JobStatus-controls a i`,
        position: 'right',
        verticalOffset: -15,
        title: <div className={styles.title}>View Job on Map</div>,
        body: <div className={styles.body}>
          Click on the globe link to display this job on the map.
        </div>,
        before: this.expandJobStatus,
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
        </div>,
        async before() {
          if (this.props.application.state.route.pathname === '/jobs') {
            this.query(`.JobStatusList-root .JobStatus-isActive .JobStatus-controls a`).click()
          }
        },
      },
      {
        step: 19,
        selector: `.JobStatusList-root .JobStatus-isActive`,
        position: 'right',
        verticalOffset: 15,
        title: <div className={styles.title}>Other Job Actions</div>,
        body: <div className={styles.body}>
          There are other actions that you can take on the job from here.
          For example, once the job has successfully completed there will be
          icons here to download the job in various formats.
        </div>,
        before: this.expandJobStatus,
      },
      {
        step: 20,
        selector: `.JobStatusList-root .JobStatus-isActive .JobStatus-removeToggle`,
        position: 'top',
        title: <div className={styles.title}>Delete Job</div>,
        body: <div className={styles.body}>
          If you expand the job details, then you can click here to delete the job.
        </div>,
        before() {
          return this.expandJobStatus().then(() => {
            const elem = this.query('.JobStatusList-root .JobStatus-isActive')

            if (!elem.classList.contains('JobStatus-isExpanded')) {
              (elem.querySelector('.JobStatus-details') as HTMLElement).click()
            }
          })
        },
      },
      {
        step: 21,
        selector: '.ol-scale-line',
        horizontalOffset: 120,
        verticalOffset: -200,
        hideArrow: true,
        title: <div className={styles.title}>That&apos;s All Folks</div>,
        body: <div className={styles.body}>
          That&apos;s all for now.  If the job has not yet completed, then you
          may want to wait a few more minutes to see how it goes.  Or you can
          just delete the job now and start you&apos;re own.  It&apos;s now up
          to you.
        </div>,
      },
    ]

    this.cancel = this.cancel.bind(this)
    this.expandJobStatus = this.expandJobStatus.bind(this)
    this.gotoStep = this.gotoStep.bind(this)
    this.isElementInViewport = this.isElementInViewport.bind(this)
    this.navigateTo = this.navigateTo.bind(this)
    this.onKeyPress = this.onKeyPress.bind(this)
    this.pace = this.pace.bind(this)
    this.query = this.query.bind(this)
    this.scrollIntoView = this.scrollIntoView.bind(this)
    this.setTabIndices = this.setTabIndices.bind(this)
    this.showArrow = this.showArrow.bind(this)
    this.start = this.start.bind(this)
    this.syncPromiseExec = this.syncPromiseExec.bind(this)
  }

  cancel() {
    this.setState({
      changing: false,
      errorMessage: null,
      isTourActive: false,
    })
  }

  componentDidMount() {
    this.start()
  }

  start() {
    this.showArrow(false)

    if (!this.state.isTourActive) {
      setTimeout(this.setTabIndices)
      this.setState({
        changing: false,
        errorMessage: null,
        isTourActive: true,
        tourStep: 1,
      })
    }
  }

  /*
   * The outer div will act as an application overlay while the tour is active,
   * preventing the user from interacting with the application.  The next div
   * will wrap the tour itself, preventing clicks in the tour from propatating
   * to the overlay.
   */
  render() {
    return (
      <div
        className={`${styles.root} ${this.state.isTourActive ? styles.overlay : ''}`}
        onClick={event => event.stopPropagation()}
      >
        <div
          onClick={event => event.stopPropagation()}
          onKeyPress={this.onKeyPress}
          style={{ display: this.state.errorMessage ? 'none' : 'block' }}
        >
          <Tour
            active={this.state.isTourActive}
            arrow={Arrow}
            buttonStyle={{}}
            closeButtonText="&#10799;"
            onBack={step => this.gotoStep(step)}
            onCancel={this.cancel}
            onNext={step => this.gotoStep(step)}
            ref="tour"
            step={this.state.tourStep}
            steps={this.steps}
          />
        </div>
        <UserTourErrorMessage message={this.state.errorMessage} tour={this}/>
      </div>
    )
  }

  private expandJobStatus() {
    return new Promise((resolve, reject) => {
      const app = this.props.application
      const promise = app.state.route.pathname === '/jobs'
        ? Promise.resolve()
        : this.navigateTo({ pathname: '/jobs', search: app.state.route.search })

      promise.then(() => {
        const elem = this.query(`.JobStatusList-root .${styles.newJob}`)

        if (!elem || Array.from(elem.classList).find(n => n === 'JobStatus-isExpanded')) {
          resolve()
        } else {
          (elem.querySelector('.JobStatus-details') as any).click()
          setTimeout(resolve, 250)
        }
      }).catch(msg => reject(msg))
    })
  }

  private gotoStep(n) {
    if (this.state.changing) {
      return Promise.reject('Tour step is in process of changing.')
    } else {
      this.state.changing = true
    }

    let functions = []
    let lastStep = this.steps.find(i => i.step === this.state.tourStep)
    let nextStep = this.steps.find(i => i.step === n)

    if (lastStep && lastStep.after) {
      functions.push(lastStep.after.bind(this))
    }

    if (nextStep) {
      if (nextStep.before) {
        functions.push(nextStep.before.bind(this))
      }

      functions.push(() => {
        return new Promise((resolve, reject) => {
          this.scrollIntoView(nextStep.selector).then(() => {
            this.showArrow(!nextStep.hideArrow)
            this.setState({ changing: false, tourStep: n })
            resolve()
          }).catch(msg => {
            if (lastStep.step > nextStep.step) {
              alert('Sorry.  It seems you cannot go back from here.')
              resolve()
            } else {
              reject(msg)
            }
          })
        })
      })
    }

    let rc = this.syncPromiseExec(functions)

    rc.then(() => {
      this.setState({ changing: false })
      this.setTabIndices()
    }).catch(msg => {
      this.setState({
        changing: false,
        errorMessage: msg,
      })
    })

    return rc
  }

  private isElementInViewport(elem): boolean {
    const box = elem.getBoundingClientRect()
    const bannerHeight = 25
    const client = {
      height: (window.innerHeight || document.documentElement.clientHeight),
      width: (window.innerWidth || document.documentElement.clientWidth),
    }

    return box.top >= bannerHeight
      && box.left >= 0
      && parseInt(box.bottom) <= client.height - bannerHeight
      && parseInt(box.right) <= client.width
  }

  private navigateTo(props): Promise<any> {
    const app = this.props.application
    const nav = typeof props === 'string' ? { pathname: props } : props

    if (nav.pathname === app.state.route.pathname) {
      return Promise.resolve(nav.pathname)
    } else {
      return new Promise((resolve, reject) => {
        app.navigateTo(nav)

        let timeout = 30000
        let t0 = Date.now()
        let interval = setInterval(() => {
          if (nav.pathname === app.state.route.pathname) {
            clearInterval(interval)
            resolve(nav.pathname)
          } else if (Date.now() - t0 > timeout) {
            clearInterval(interval)
            reject(`Timed out after ${timeout / 1000} seconds waiting for ${nav.pathname}.`)
          }
        }, 10)
      })
    }
  }

  private onKeyPress(event) {
    event.stopPropagation()

    switch (event.key) {
      case 'Enter': {
        const button = this.query('.react-user-tour-button-container div:focus')

        if (button) {
          button.click()
        }

        break
      }
      case 'Escape': {
        this.cancel()

        break
      }
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

  private query(selector: string): HTMLElement {
    return document.querySelector(selector) as HTMLElement
  }

  private setTabIndices() {
    const buttons: any[] = [
      this.query('.react-user-tour-button-container .react-user-tour-done-button'),
      this.query('.react-user-tour-button-container .react-user-tour-next-button'),
      this.query('.react-user-tour-button-container .react-user-tour-back-button'),
    ].filter(b => b).map((button, i) => {
      button.setAttribute('tabindex', (i + 1).toString())
      return button
    })

    if (buttons.length) {
      buttons[0].focus()
    }

    return buttons[0]
  }

  private scrollIntoView(selector: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let elem = typeof selector === 'string' ? this.query(selector) : selector

      if (elem) {
        if (this.isElementInViewport(elem)) {
          resolve()
        } else {
          elem.scrollIntoView({ behavior: 'smooth' })

          let timeout = 10000
          let t0 = Date.now()
          let interval = setInterval(() => {
            if (this.isElementInViewport(elem)) {
              clearInterval(interval)
              setTimeout(resolve, 100)
            } else if (Date.now() - t0 > timeout) {
              clearInterval(interval)
              reject(`Timed out after ${timeout / 1000} seconds scrolling ${selector} into view.`)
            }
          }, 100)
        }
      } else {
        let message = `The DOM element, "${selector}", is not available.`
        console.warn(message)
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

  private syncPromiseExec(functions: any[]): Promise<any> {
    return functions.reduce((current, next) => current.then(next), Promise.resolve())
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
