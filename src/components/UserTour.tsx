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
import {TOUR} from '../config'
import {query, scrollIntoView} from '../utils/domUtils'
import {connect} from 'react-redux'
import {catalogActions, ParamsCatalogUpdateSearchCriteria} from '../actions/catalogActions'
import {mapActions, ParamsMapPanToPoint} from '../actions/mapActions'
import {AppState} from '../store'
import {ParamsRouteNavigateTo, routeActions} from '../actions/routeActions'
import {RouteState} from '../reducers/routeReducer'
import {CatalogState} from '../reducers/catalogReducer'
import {MapState} from '../reducers/mapReducer'
import {JobsState} from '../reducers/jobsReducer'

const styles: any = require('./UserTour.css')

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

interface Props {
  route?: RouteState
  catalog?: CatalogState
  map?: MapState
  jobs?: JobsState
  catalogResetSearchCriteria?(): void
  catalogSerialize?(): void
  catalogUpdateSearchCriteria?(args: ParamsCatalogUpdateSearchCriteria): void
  catalogSetApiKey?(apiKey: string): void
  mapPanToPoint?(args: ParamsMapPanToPoint): void
  mapUpdateBbox?(bbox: [number, number, number, number]): void
  mapClearBbox?(): void
  mapSetSelectedFeature?(feature: GeoJSON.Feature<any> | null): void
  routeNavigateTo?(args: ParamsRouteNavigateTo): void
}

export class UserTour extends React.Component<Props, any> {
  private algorithm: string
  private apiKeyInstructions: any
  private basemap: string
  private bbox: [number, number, number, number]
  private bboxName: string
  private searchCriteria: any
  private steps: any[]
  private zoom: number

  constructor(props: Props) {
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
        before: async () => {
          if (!query('.BasemapSelect-root.BasemapSelect-isOpen')) {
            query('.BasemapSelect-button').click()
          }
        },
        after: async () => {
          const basemaps: any = document.querySelectorAll('.BasemapSelect-options li')

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
        before: () => {
          return this.navigateTo('/')
        },
        after: () => {
          this.props.catalogResetSearchCriteria()
          this.props.catalogSerialize()

          return this.navigateTo('/').then(() => {
            // Pan to the center of the bound box that we will highlight later.
            this.props.mapPanToPoint({
              point: [
                (this.bbox[0] + this.bbox[2]) / 2,
                (this.bbox[1] + this.bbox[3]) / 2,
              ],
              zoom: this.zoom,
            })
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
        before: () => {
          this.props.mapClearBbox()
          return this.navigateTo('/create-job')
        },
        after: () => {
          this.showArrow(false)

          return new Promise(resolve => {
            const bbox = this.props.map.bbox

            if (!bbox || this.bbox.some((x, i) => x !== bbox[i])) {
              const duration = 1000
              const n = 20
              let i = 0
              const interval = setInterval(() => {
                ++i

                this.props.mapUpdateBbox([
                  this.bbox[0],
                  this.bbox[1],
                  this.bbox[0] + i / n * (this.bbox[2] - this.bbox[0]),
                  this.bbox[1] + i / n * (this.bbox[3] - this.bbox[1]),
                ])

                if (i >= n) {
                  clearInterval(interval)
                  this.props.mapUpdateBbox(this.bbox)
                  resolve()
                }
              }, duration / n)
            }

            this.props.mapUpdateBbox(this.bbox)
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
        after: async () => {
          if (this.props.catalog.searchCriteria.source !== this.searchCriteria.source) {
            this.props.catalogUpdateSearchCriteria({
              source: this.searchCriteria.source,
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
        after: async () => {
          const input = query(`.${styles.apiKey} input`) as HTMLInputElement
          this.props.catalogSetApiKey(input.value)
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
        after: async () => {
          const search = this.searchCriteria
          const fromElem = query('.CatalogSearchCriteria-captureDateFrom input') as HTMLInputElement
          if (fromElem && fromElem.value !== search.dateFrom) {
            await this.pace(search.dateFrom, (_, s) => fromElem.value = s)
          }

          this.props.catalogUpdateSearchCriteria({
            dateFrom: search.dateFrom,
          })

          const toElem = query('.CatalogSearchCriteria-captureDateTo input') as HTMLInputElement
          if (toElem && toElem.value !== search.dateTo) {
            await this.pace(search.dateTo, (_, s) => toElem.value = s)
          }

          this.props.catalogUpdateSearchCriteria({
            dateTo: search.dateTo,
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
        after: () => {
          return new Promise(resolve => {
            function gen(from, to): number[] {
              const rc: number[] = []
              const sign = Math.sign(to - from)

              for (let i = from + sign; Math.abs(to - i); i += sign) {
                rc.unshift(i)
              }

              rc.unshift(to)

              return rc
            }

            if (this.props.catalog.searchCriteria.cloudCover === this.searchCriteria.cloudCover) {
              resolve()
            } else {
              const fn = (g) => {
                const i = g.pop()

                if (i == null) {
                  setTimeout(resolve, 100)
                } else {
                  setTimeout(() => {
                    this.props.catalogUpdateSearchCriteria({
                      cloudCover: i,
                    })

                    fn(g)
                  }, 250)
                }
              }

              fn(gen(this.props.catalog.searchCriteria.cloudCover, this.searchCriteria.cloudCover))
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
        after: () => {
          if (this.props.catalog.searchResults) {
            return Promise.resolve()
          } else {
            query('.ImagerySearch-controls button[type=submit]').click()
            this.showArrow(false)

            return new Promise((resolve, reject) => {
              const timeout = 60000
              const t0 = Date.now()
              const interval = setInterval(() => {
                if (this.props.catalog.searchResults) {
                  clearInterval(interval)
                  resolve()
                } else if (Date.now() - t0 > timeout) {
                  clearInterval(interval)
                  reject(`Timed out after ${timeout / 1000} seconds waiting for imagery results.`)
                } else {
                  const elem = query('.ImagerySearch-errorMessage')

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
        after: () => {
          return new Promise(resolve => {
            // Get the feature with the least amount of cloud cover.
            const feature = this.props.catalog.searchResults.images.features.filter(f => {
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
            this.props.mapSetSelectedFeature(feature)
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
        after: () => {
          const algorithm = query(`.AlgorithmList-root li${this.algorithm}`)
          const startButton = algorithm.querySelector('.Algorithm-startButton') as HTMLElement
          startButton.click()

          return new Promise((resolve, reject) => {
            const timeout = 30000
            const t0 = Date.now()
            const interval = setInterval(() => {
              if (this.props.route.pathname === '/jobs') {
                clearInterval(interval)
                resolve()
              } else if (Date.now() - t0 > timeout) {
                clearInterval(interval)
                reject(`Timed out after ${timeout / 1000} seconds waiting for /jobs.`)
              } else {
                const elem = algorithm.querySelector('.AlgorithmList-errorMessage')

                if (elem) {
                  const m = elem.querySelector('h4')

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
        before: () => {
          return this.expandJobStatus().then(() => {
            const elem = query('.JobStatusList-root .JobStatus-isActive')

            if (!elem.classList.contains('JobStatus-isExpanded')) {
              const details = elem.querySelector('.JobStatus-details') as HTMLElement
              details.click()
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
        before: async () => {
          if (this.props.route.pathname === '/jobs') {
            query(`.JobStatusList-root .JobStatus-isActive .JobStatus-controls a`).click()
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
        before: () => {
          return this.expandJobStatus().then(() => {
            const elem = query('.JobStatusList-root .JobStatus-isActive')

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
    this.navigateTo = this.navigateTo.bind(this)
    this.onKeyPress = this.onKeyPress.bind(this)
    this.pace = this.pace.bind(this)
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
      const promise = this.props.route.pathname === '/jobs'
        ? Promise.resolve()
        : this.navigateTo({ pathname: '/jobs', search: this.props.route.search })

      promise.then(() => {
        const elem = query(`.JobStatusList-root .${styles.newJob}`)

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

    const functions = []
    const lastStep = this.steps.find(i => i.step === this.state.tourStep)
    const nextStep = this.steps.find(i => i.step === n)

    if (lastStep && lastStep.after) {
      functions.push(lastStep.after.bind(this))
    }

    if (nextStep) {
      if (nextStep.before) {
        functions.push(nextStep.before.bind(this))
      }

      functions.push(() => {
        return new Promise((resolve, reject) => {
          scrollIntoView(nextStep.selector).then(() => {
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

    const rc = this.syncPromiseExec(functions)

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

  private navigateTo(props): Promise<any> {
    const nav = typeof props === 'string' ? { pathname: props } : props

    if (nav.pathname === this.props.route.pathname) {
      return Promise.resolve(nav.pathname)
    } else {
      return new Promise((resolve, reject) => {
        this.props.routeNavigateTo({ location: nav })

        const timeout = 30000
        const t0 = Date.now()
        const interval = setInterval(() => {
          if (nav.pathname === this.props.route.pathname) {
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
        const button = query('.react-user-tour-button-container div:focus')

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
      let i = 0
      const interval = setInterval(() => {
        if (i < text.length) {
          cb(text.charAt(i), text.substring(0, ++i))
        } else {
          clearInterval(interval)
          resolve(text)
        }
      }, delay)
    })
  }

  private setTabIndices() {
    const buttons: any[] = [
      query('.react-user-tour-button-container .react-user-tour-done-button'),
      query('.react-user-tour-button-container .react-user-tour-next-button'),
      query('.react-user-tour-button-container .react-user-tour-back-button'),
    ].filter(b => b).map((button, i) => {
      button.setAttribute('tabindex', (i + 1).toString())
      return button
    })

    if (buttons.length) {
      buttons[0].focus()
    }

    return buttons[0]
  }

  private showArrow(show: boolean): void {
    const arrow = query(`.${styles.arrow}`)

    if (arrow) {
      arrow.style.visibility = show ? 'visible' : 'hidden'
    }
  }

  private syncPromiseExec(functions: any[]): Promise<any> {
    return functions.reduce((current, next) => current.then(next), Promise.resolve())
  }

  private get imageCount(): string {
    const results = this.props.catalog.searchResults

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
    const jobs = this.props.jobs
    const job = jobs && jobs.records && jobs.records[jobs.records.length - 1]

    return job && job.properties && job.properties.status || 'Unknown'
  }

  private get sourceName() {
    const options = document.querySelectorAll('.CatalogSearchCriteria-source select option')
    const option: any = options && Array.from(options).find((o: any) => {
      return o.value === this.searchCriteria.source
    })

    return option && option.text
  }
}

function mapStateToProps(state: AppState) {
  return {
    route: state.route,
    catalog: state.catalog,
    map: state.map,
    job: state.jobs,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    catalogResetSearchCriteria: () => dispatch(catalogActions.resetSearchCriteria()),
    catalogUpdateSearchCriteria: (args: ParamsCatalogUpdateSearchCriteria) => (
      dispatch(catalogActions.updateSearchCriteria(args))
    ),
    catalogSetApiKey: (apiKey: string) => dispatch(catalogActions.setApiKey(apiKey)),
    catalogSerialize: () => dispatch(catalogActions.serialize()),
    mapPanToPoint: (args: ParamsMapPanToPoint) => dispatch(mapActions.panToPoint(args)),
    mapUpdateBbox: (bbox: [number, number, number, number]) => dispatch(mapActions.updateBbox(bbox)),
    mapClearBbox: () => dispatch(mapActions.clearBbox()),
    mapSetSelectedFeature: (feature: GeoJSON.Feature<any> | null) => (
      dispatch(mapActions.setSelectedFeature(feature))
    ),
    routeNavigateTo: (args: ParamsRouteNavigateTo) => dispatch(routeActions.navigateTo(args)),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(UserTour)
