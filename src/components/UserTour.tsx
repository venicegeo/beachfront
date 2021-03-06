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
import ReactUserTour from 'react-user-tour'
import {TOUR} from '../config'
import {query} from '../utils/domUtils'
import {connect} from 'react-redux'
import {Catalog, CatalogUpdateSearchCriteriaArgs} from '../actions/catalogActions'
import {Map} from '../actions/mapActions'
import {AppState} from '../store'
import {RouteNavigateToArgs, Route, RouteLocation} from '../actions/routeActions'
import {Extent, Point} from '../utils/geometries'
import {Tour, TourStep} from '../actions/tourActions'

const styles: any = require('./UserTour.css')

const Arrow = ({ position }: { position: string }) => {
  const classnames: {[key: string]: string} = {
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

const UserTourErrorMessage = (props: {
  error: Error | null,
  onDismiss: () => any
}) => {
  return props.error ? <div className={styles.error}>
    <div className={styles.close} title="Dismiss" onClick={props.onDismiss}>&times;</div>
    <div className={styles.header}>Oops!</div>
    <div className={styles.message}>{props.error.message}</div>
  </div> : null
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type Props = StateProps & DispatchProps

export class UserTour extends React.Component<Props> {
  private algorithm: string
  private apiKeyInstructions: any
  private basemap: string
  private bbox: Extent
  private bboxName: string
  private searchCriteria: any
  private zoom: number

  constructor(props: Props) {
    super(props)

    this.algorithm = TOUR.algorithm
    this.apiKeyInstructions = <div dangerouslySetInnerHTML={{ __html: TOUR.apiKeyInstructions }}/>
    this.basemap = TOUR.basemap
    this.bbox = TOUR.bbox as Extent
    this.bboxName = TOUR.bboxName
    this.searchCriteria = TOUR.searchCriteria
    this.zoom = TOUR.zoom

    this.expandJobStatus = this.expandJobStatus.bind(this)
    this.navigateTo = this.navigateTo.bind(this)
    this.onKeyPress = this.onKeyPress.bind(this)
    this.pace = this.pace.bind(this)
    this.setTabIndices = this.setTabIndices.bind(this)
    this.showArrow = this.showArrow.bind(this)
  }

  componentDidMount() {
    this.props.dispatch.tour.setSteps([
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
        before: () => {
          if (!query('.BasemapSelect-root.BasemapSelect-isOpen')) {
            query('.BasemapSelect-button').click()
          }
        },
        after: () => {
          const basemaps = document.querySelectorAll('.BasemapSelect-options li') as NodeListOf<HTMLElement>

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
        before: () => this.navigateTo('/'),
        after: async () => {
          this.props.dispatch.catalog.resetSearchCriteria()
          this.props.dispatch.catalog.serialize()

          await this.navigateTo('/')

          // Pan to the center of the bound box that we will highlight later.
          this.props.dispatch.map.panToPoint({
            point: [
              (this.bbox[0] + this.bbox[2]) / 2,
              (this.bbox[1] + this.bbox[3]) / 2,
            ],
            zoom: this.zoom,
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
        before: async () => {
          this.props.dispatch.map.clearBbox()
          await this.navigateTo('/create-job')
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

                this.props.dispatch.map.updateBbox([
                  this.bbox[0],
                  this.bbox[1],
                  this.bbox[0] + i / n * (this.bbox[2] - this.bbox[0]),
                  this.bbox[1] + i / n * (this.bbox[3] - this.bbox[1]),
                ])

                if (i >= n) {
                  clearInterval(interval)
                  this.props.dispatch.map.updateBbox(this.bbox)
                  resolve()
                }
              }, duration / n)
            }

            this.props.dispatch.map.updateBbox(this.bbox)
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
        after: () => {
          if (this.props.catalog.searchCriteria.source !== this.searchCriteria.source) {
            this.props.dispatch.catalog.updateSearchCriteria({
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
              <input defaultValue={localStorage.getItem('catalog_apiKey') || undefined} type="password"/>
            </label>
          </div>
          {this.apiKeyInstructions}
        </div>,
        after: () => {
          const input = query(`.${styles.apiKey} input`) as HTMLInputElement
          this.props.dispatch.catalog.setApiKey(input.value)
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
            await this.pace(search.dateFrom, (_: any, s: string) => fromElem.value = s)
          }

          this.props.dispatch.catalog.updateSearchCriteria({
            dateFrom: search.dateFrom,
          })

          const toElem = query('.CatalogSearchCriteria-captureDateTo input') as HTMLInputElement
          if (toElem && toElem.value !== search.dateTo) {
            await this.pace(search.dateTo, (_: any, s: string) => toElem.value = s)
          }

          this.props.dispatch.catalog.updateSearchCriteria({
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
            function gen(from: number, to: number): number[] {
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
              const fn = (g: number[]) => {
                const i = g.pop()

                if (i == null) {
                  setTimeout(resolve, 100)
                } else {
                  setTimeout(() => {
                    this.props.dispatch.catalog.updateSearchCriteria({
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
            if (!this.props.catalog.searchResults) {
              throw new Error('Catalog search results are null!')
            }

            // Get the feature with the least amount of cloud cover.
            const feature = this.props.catalog.searchResults.images.features.filter(f => {
              // Eliminate images w/ zero cloud cover; that may mean a bad image.
              return f.properties && f.properties.cloudCover
            }).sort((a, b) => {
              return (a.properties && b.properties) ? a.properties.cloudCover - b.properties.cloudCover : 0
            }).shift()

            if (!feature) {
              throw new Error('A valid feature could not be found!')
            }

            /*
            Manually setting this 'type' here is a hack to force the
            FeatureDetails to render.  I'm not sure how this gets set to
            the correct value in the normal course of events.
            */
            if (feature.properties) {
              feature.properties.type = TYPE_SCENE
            }
            this.props.dispatch.map.setSelectedFeature(feature)
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
        before: async () => {
          await this.expandJobStatus()

          const elem = query('.JobStatusList-root .JobStatus-isActive')

          if (!elem.classList.contains('JobStatus-isExpanded')) {
            const details = elem.querySelector('.JobStatus-caret') as HTMLElement
            details.click()
          }
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
        before: () => {
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
        before: async () => {
          await this.expandJobStatus()

          const elem = query('.JobStatusList-root .JobStatus-isActive')

          if (!elem.classList.contains('JobStatus-isExpanded')) {
            (elem.querySelector('.JobStatus-caret') as HTMLElement).click()
          }
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
    ])
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.tour.inProgress && this.props.tour.inProgress) {
      if (this.props.tour.inProgress) {
        const step = this.props.tour.steps[this.props.tour.step - 1]
        this.showArrow(!step.hideArrow)
      } else {
        this.showArrow(false)
      }
      setTimeout(this.setTabIndices)
    }

    if (prevProps.tour.step !== this.props.tour.step) {
      const step = this.props.tour.steps[this.props.tour.step - 1]
      this.showArrow(!step.hideArrow)
      this.setTabIndices()
    }
  }

  /*
   * The outer div will act as an application overlay while the tour is active,
   * preventing the user from interacting with the application.  The next div
   * will wrap the tour itself, preventing clicks in the tour from propatating
   * to the overlay.
   */
  render() {
    return this.props.tour.inProgress && (
      <div
        className={`${styles.root} ${styles.overlay}`}
        onClick={event => event.stopPropagation()}
      >
        <div
          onClick={event => event.stopPropagation()}
          onKeyPress={this.onKeyPress}
          style={{ display: this.props.tour.error ? 'none' : 'block' }}
        >
          <ReactUserTour
            active={this.props.tour.inProgress}
            arrow={Arrow}
            buttonStyle={{}}
            closeButtonText="&#10799;"
            onBack={this.props.dispatch.tour.goToStep}
            onCancel={this.props.dispatch.tour.end}
            onNext={this.props.dispatch.tour.goToStep}
            ref="tour"
            step={this.props.tour.step}
            steps={this.props.tour.steps}
          />
        </div>
        <UserTourErrorMessage error={this.props.tour.error} onDismiss={this.props.dispatch.tour.end}/>
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
          (elem.querySelector('.JobStatus-caret') as any).click()
          setTimeout(resolve, 250)
        }
      }).catch(msg => reject(msg))
    })
  }

  private navigateTo(props: string | RouteLocation): Promise<any> {
    const loc = typeof props === 'string' ? { pathname: props } : props

    if (loc.pathname === this.props.route.pathname) {
      return Promise.resolve(loc.pathname)
    } else {
      return new Promise((resolve, reject) => {
        this.props.dispatch.route.navigateTo({ loc })

        const timeout = 30000
        const t0 = Date.now()
        const interval = setInterval(() => {
          if (loc.pathname === this.props.route.pathname) {
            clearInterval(interval)
            resolve(loc.pathname)
          } else if (Date.now() - t0 > timeout) {
            clearInterval(interval)
            reject(`Timed out after ${timeout / 1000} seconds waiting for ${loc.pathname}.`)
          }
        }, 10)
      })
    }
  }

  private onKeyPress(event: React.KeyboardEvent) {
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
        this.props.dispatch.tour.end()

        break
      }
    }
  }

  private pace(text: string, cb: (a: string, b: string) => void, delay = 100): Promise<string> {
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

  private get imageCount(): string {
    const results = this.props.catalog.searchResults
    if (!results) {
      return 'images'
    } else if (results.count === 1) {
      return 'one image'
    } else {
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
    jobs: state.jobs,
    tour: state.tour,
  }
}

function mapDispatchToProps(dispatch: Function) {
  return {
    dispatch: {
      catalog: {
        resetSearchCriteria: () => dispatch(Catalog.resetSearchCriteria()),
        updateSearchCriteria: (args: CatalogUpdateSearchCriteriaArgs) => (
          dispatch(Catalog.updateSearchCriteria(args))
        ),
        setApiKey: (apiKey: string) => dispatch(Catalog.setApiKey(apiKey)),
        serialize: () => dispatch(Catalog.serialize()),
      },
      map: {
        panToPoint: (args: { point: Point, zoom?: number }) => dispatch(Map.panToPoint(args)),
        updateBbox: (bbox: Extent) => dispatch(Map.updateBbox(bbox)),
        clearBbox: () => dispatch(Map.clearBbox()),
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => (
          dispatch(Map.setSelectedFeature(feature))
        ),
      },
      route: {
        navigateTo: (args: RouteNavigateToArgs) => dispatch(Route.navigateTo(args)),
      },
      tour: {
        setSteps: (steps: TourStep[]) => dispatch(Tour.setSteps(steps)),
        end: () => dispatch(Tour.end()),
        goToStep: (step: number) => dispatch(Tour.goToStep(step)),
      },
    },
  }
}

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(UserTour)
