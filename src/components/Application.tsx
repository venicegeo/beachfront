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
import {jobsActions} from '../actions/jobsActions'

const styles: any = require('./Application.css')

import * as React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux'
import * as debounce from 'lodash/debounce'
import * as moment from 'moment'
import About from './About'
import {BrowserSupport} from './BrowserSupport'
import {ClassificationBanner} from './ClassificationBanner'
import CreateJob, {SearchCriteria, createSearchCriteria} from './CreateJob'
import CreateProductLine from './CreateProductLine'
import JobStatusList from './JobStatusList'
import {Login} from './Login'
import Navigation from './Navigation'
import PrimaryMap from './PrimaryMap'
import {ProductLineList} from './ProductLineList'
import SessionExpired from './SessionExpired'
import SessionLoggedOut from './SessionLoggedOut'
import * as catalogService from '../api/catalog'
import * as geoserverService from '../api/geoserver'
import * as productLinesService from '../api/productLines'
import * as sessionService from '../api/session'
import {createCollection, Collection} from '../utils/collections'
import {
  featureToExtentWrapped,
  getFeatureCenter,
} from '../utils/geometries'
import {
  RECORD_POLLING_INTERVAL,
  SESSION_IDLE_INTERVAL,
  SESSION_IDLE_TIMEOUT,
  SESSION_IDLE_STORE,
  SESSION_IDLE_UNITS,
} from '../config'
import {UserTour} from './Tour'

import {
  TYPE_JOB,
} from '../constants'
import {UserState} from '../reducers/userReducer'
import {userActions} from '../actions/userActions'
import {CatalogState} from '../reducers/catalogReducer'
import {catalogActions} from '../actions/catalogActions'
import {RouteState} from '../reducers/routeReducer'
import {routeActions} from '../actions/routeActions'
import {mapActions, shouldSelectedFeatureAutoDeselect} from '../actions/mapActions'
import {MapState} from '../reducers/mapReducer'
import {JobsState} from '../reducers/jobsReducer'
import {AppState} from '../store'
import {enabledPlatformsActions} from '../actions/enabledPlatformsActions'
import {EnabledPlatformsState} from '../reducers/enabledPlatformsReducer'
import {algorithmsActions} from '../actions/algorithmsActions'

interface Props {
  user?: UserState
  catalog?: CatalogState
  route?: RouteState
  map?: MapState
  jobs?: JobsState
  enabledPlatforms?: EnabledPlatformsState
  userLogin?(args): void
  userLogout?(): void
  routeNavigateTo?(loc, pushHistory?: boolean): void
  userSessionExpired?(): void
  userSerialize?(): void
  catalogSerialize?(): void
  userDeserialize?(): void
  catalogDeserialize?(): void
  mapUpdateMode?(): void
  mapUpdateDetections?(): void
  mapUpdateFrames?(): void
  mapSetSelectedFeature?(selectedFeature: beachfront.Job | beachfront.Scene | null): void
  mapUpdateSelectedFeature?(): void
  mapSetHoveredFeature?(hoveredFeature: beachfront.Job | null): void
  mapPanToPoint?(point: [number, number], zoom?: number): void
  mapPanToExtent?(extent: [number, number, number, number]): void
  mapSerialize?(): void
  mapDeserialize?(): void
  jobsFetch?(): void
  jobsFetchOne?(jobId: string): void
  enabledPlatformsFetch?(): void
  enabledPlatformsSerialize?(): void
  enabledPlatformsDeserialize?(): void
  algorithmsFetch?(): void
  algorithmsSerialize?(): void
  algorithmsDeserialize?(): void
}

interface State {
  // Services
  geoserver?: geoserverService.Descriptor

  // Data Collections
  productLines?: Collection<beachfront.ProductLine>

  // Search state
  isSearching?: boolean
  searchCriteria?: SearchCriteria
  searchError?: any
  searchResults?: beachfront.ImageryCatalogPage
}

export class Application extends React.Component<Props, State> {
  refs: any
  private pollingInstance: number
  private idleInterval: any
  private tour: any

  constructor(props) {
    super(props)
    this.generateInitialState = this.generateInitialState.bind(this)
    this.importJobsIfNeeded = this.importJobsIfNeeded.bind(this)
    this.handleDismissProductLineError = this.handleDismissProductLineError.bind(this)
    this.handleNavigateToJob = this.handleNavigateToJob.bind(this)
    this.handlePanToProductLine = this.handlePanToProductLine.bind(this)
    this.handleProductLineCreated = this.handleProductLineCreated.bind(this)
    this.handleProductLineJobHoverIn = this.handleProductLineJobHoverIn.bind(this)
    this.handleProductLineJobHoverOut = this.handleProductLineJobHoverOut.bind(this)
    this.handleProductLineJobSelect = this.handleProductLineJobSelect.bind(this)
    this.handleProductLineJobDeselect = this.handleProductLineJobDeselect.bind(this)
    this.handleSearchCriteriaChange = this.handleSearchCriteriaChange.bind(this)
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this)
    this.handleSignOutClick = this.handleSignOutClick.bind(this)
    this.startIdleTimer = this.startIdleTimer.bind(this)
    this.stopIdleTimer = this.stopIdleTimer.bind(this)
    this.startTour = this.startTour.bind(this)
    this.timerIncrement = this.timerIncrement.bind(this)
    this.resetTimer = this.resetTimer.bind(this)
    this.serialize = debounce(this.serialize.bind(this), 500)

    this.state = this.generateInitialState()
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (!prevProps.user.isLoggedIn && this.props.user.isLoggedIn) {
      this.initializeServices()
      this.startBackgroundTasks()
      this.refreshRecords()
    }

    if (!prevProps.user.isSessionExpired && this.props.user.isSessionExpired || prevProps.user.isLoggedIn && !this.props.user.isLoggedIn) {
      this.stopBackgroundTasks()
      this.stopIdleTimer()
    }

    if (prevProps.route !== this.props.route) {
      if (prevProps.route.pathname !== this.props.route.pathname ||
          prevProps.map.bbox !== this.props.map.bbox ||
          prevProps.catalog.searchResults !== this.props.catalog.searchResults) {
        this.props.mapUpdateMode()
      }

      if (prevProps.route.jobIds.join(',') !== this.props.route.jobIds.join(',')) {
        this.importJobsIfNeeded()
      }

      this.props.mapUpdateSelectedFeature()
    }

    if (prevProps.map.mode !== this.props.map.mode ||
        prevProps.map.selectedFeature !== this.props.map.selectedFeature ||
        prevProps.jobs !== this.props.jobs) {
      this.props.mapUpdateDetections()
      this.props.mapUpdateFrames()
    }

    if (prevProps.map.selectedFeature !== this.props.map.selectedFeature) {
      let search = ''
      if (this.props.map.selectedFeature && this.props.map.selectedFeature.properties.type === TYPE_JOB) {
        search = `?jobId=${this.props.map.selectedFeature.id}`
      }

      this.props.routeNavigateTo({
        pathname: this.props.route.pathname,
        search,
      })
    }

    if (prevProps.jobs.fetching && !this.props.jobs.fetching) {
      // Load selected feature if it isn't already (e.g., page refresh w/ jobId).
      let [jobId] = this.props.route.jobIds

      if (jobId && !this.props.map.selectedFeature) {
        this.props.mapSetSelectedFeature(this.props.jobs.records.find(job => job.id === jobId))
      }

      this.importJobsIfNeeded()
    }

    if (prevProps.jobs.fetchingOne && !this.props.jobs.fetchingOne) {
      this.props.mapPanToPoint(getFeatureCenter(this.props.jobs.lastOneFetched))
    }

    if (prevProps.jobs.creatingJob && !this.props.jobs.creatingJob) {
      this.props.routeNavigateTo({
        pathname: '/jobs',
        search: '?jobId=' + this.props.jobs.createdJob.id,
      })
    }

    if (prevProps.jobs.deletingJob && !this.props.jobs.deletingJob) {
      if (this.props.route.jobIds.includes(this.props.jobs.deletedJob.id)) {
        this.props.routeNavigateTo({
          pathname: this.props.route.pathname,
          search: this.props.route.search.replace(new RegExp('\\??jobId=' + this.props.jobs.deletedJob.id), ''),
        })
      }
    }

    this.serialize()
  }

  componentWillMount() {
    this.deserialize()
    this.subscribeToHistoryEvents()
    if (this.props.user.isLoggedIn && !this.props.user.isSessionExpired) {
      this.initializeServices()
      this.startBackgroundTasks()
      this.refreshRecords()
      this.startIdleTimer()
    }
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.resetTimer)
    document.addEventListener('keyup', this.resetTimer)

    this.props.mapUpdateMode()
  }

  render() {
    const allowedEndpoints = [
      '/jobs',
      '/create-job',
      '/product-lines',
      '/create-product-line',
    ]
    const shrunk = allowedEndpoints.indexOf(this.props.route.pathname) > -1
    return (
      <div className={styles.root}>
        <ClassificationBanner anchor="top"/>
        <BrowserSupport/>
        <Navigation
          shrunk={shrunk}
          startTour={this.startTour}
        />
        <PrimaryMap
          imagery={this.state.searchResults}
          isSearching={this.state.isSearching}
          ref="map"
          shrunk={shrunk}
          wmsUrl={this.state.geoserver.wmsUrl}
          onSearchPageChange={this.handleSearchSubmit}
          onSignOutClick={this.handleSignOutClick}
        />
        {this.renderRoute()}
        {this.props.user.isSessionExpired && (
          <SessionExpired />
        )}
        {this.props.user.isSessionLoggedOut && (
          <SessionLoggedOut />
        )}
        <ClassificationBanner anchor="bottom"/>
      </div>
    )
  }

  renderRoute() {
    if (!this.props.user.isLoggedIn) {
      return (
        <Login/>
      )
    }

    switch (this.props.route.pathname) {
      case '/about':
        return (
          <About />
        )
      case '/create-job':
        return (
          <CreateJob
            imagery={this.state.searchResults}
            isSearching={this.state.isSearching}
            mapRef={this.refs.map}
            searchCriteria={this.state.searchCriteria}
            searchError={this.state.searchError}
            onSearchCriteriaChange={this.handleSearchCriteriaChange}
            onSearchSubmit={this.handleSearchSubmit}
          />
        )
      case '/create-product-line':
        return (
          <CreateProductLine
            onProductLineCreated={this.handleProductLineCreated}
          />
        )
      case '/jobs':
        return (
          <JobStatusList
            onNavigateToJob={this.handleNavigateToJob}
          />
        )
      case '/product-lines':
        return (
          <ProductLineList
            error={this.state.productLines.error}
            isFetching={this.state.productLines.fetching}
            productLines={this.state.productLines.records}
            onDismissError={this.handleDismissProductLineError}
            onJobHoverIn={this.handleProductLineJobHoverIn}
            onJobHoverOut={this.handleProductLineJobHoverOut}
            onJobSelect={this.handleProductLineJobSelect}
            onJobDeselect={this.handleProductLineJobDeselect}
            onPanTo={this.handlePanToProductLine}
          />
        )
      default:
        return (
          <div className={styles.unknownRoute}>
            wat
          </div>
        )
    }
  }

  //
  // Internals
  //

  private importJobsIfNeeded() {
    this.props.route.jobIds.map(jobId => {
      if (this.props.jobs.records.find(j => j.id === jobId)) {
        return
      }
      this.props.jobsFetchOne(jobId)
    })
  }

  private initializeServices() {
    this.props.enabledPlatformsFetch()
    this.props.algorithmsFetch()
    this.fetchGeoserverConfig()
    this.initializeCatalog()
  }

  private fetchGeoserverConfig() {
    return geoserverService.lookup()
      .then(geoserver => this.setState({ geoserver }))
      // .catch(err => this.setState({ errors: [...this.props.errors, err] }))
  }

  private fetchProductLines() {
    this.setState({ productLines: this.state.productLines.$fetching() })
    return productLinesService.fetchProductLines()
      .then(records => this.setState({ productLines: this.state.productLines.$records(records) }))
      .catch(err => this.setState({ productLines: this.state.productLines.$error(err) }))
  }

  private initializeCatalog() {
    return catalogService.initialize()
      // .catch(err => this.setState({ errors: [...this.state.errors, err] }))
  }

  private handleDismissProductLineError() {
    this.setState({
      productLines: this.state.productLines.$error(null),
    })
    setTimeout(() => this.fetchProductLines())
  }

  private handleNavigateToJob(loc) {
    this.props.routeNavigateTo(loc)
    const feature = this.props.jobs.records.find(j => loc.search.includes(j.id))
    this.props.mapPanToExtent(featureToExtentWrapped(this.props.map.map, feature))
  }

  private handlePanToProductLine(productLine) {
    this.props.mapPanToPoint(getFeatureCenter(productLine), 3.5)
  }

  private handleProductLineCreated(productLine: beachfront.ProductLine) {
    this.setState({
      productLines: this.state.productLines.$append(productLine),
    })
    this.props.routeNavigateTo({ pathname: '/product-lines' })
  }

  private handleProductLineJobHoverIn(job) {
    this.props.mapSetHoveredFeature(job)
  }

  private handleProductLineJobHoverOut() {
    this.props.mapSetHoveredFeature(null)
  }

  private handleProductLineJobSelect(job) {
    this.props.mapSetSelectedFeature(job)
  }

  private handleProductLineJobDeselect() {
    this.props.mapSetSelectedFeature(null)
  }

  private handleSearchCriteriaChange(searchCriteria) {
    this.setState({ searchCriteria })
  }

  private handleSearchSubmit({startIndex = 0, count = 100} = {}) {
    let newState: any = { isSearching: true }
    const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
    if (shouldDeselect) {
      newState.selectedFeature = null
    }
    this.setState(newState)

    catalogService.search({
      count,
      startIndex,
      bbox: this.props.map.bbox,
      catalogApiKey: this.props.catalog.apiKey,
      ...this.state.searchCriteria,
    }).then(searchResults => {
      this.setState({
        searchResults,
        searchError: null,
        isSearching: false,
      })
      scrollIntoView('.ImagerySearchList-results')
    }).catch(searchError => this.setState({
      searchError,
      isSearching: false,
    }))
  }

  private handleSignOutClick() {
    if (confirm('Are you sure you want to sign out of Beachfront?')) {
      this.props.userLogout()
    }
  }

  private refreshRecords() {
    this.props.jobsFetch()
  }

  //
  // Inactivity Timeout
  //

  // Increment the idle time counter every minute.
  private startIdleTimer() {
    localStorage.setItem(SESSION_IDLE_STORE, moment().utc().format())

    this.idleInterval = setInterval(this.timerIncrement, SESSION_IDLE_INTERVAL)
    return null
  }

  private timerIncrement() {
    if (this.props.user.isLoggedIn && !this.props.user.isSessionExpired) {
      const lastActivity = moment(localStorage.getItem(SESSION_IDLE_STORE))
      const timeSinceLast = moment().utc().diff(lastActivity, SESSION_IDLE_UNITS)
      if (timeSinceLast >= SESSION_IDLE_TIMEOUT) {
        this.props.userLogout()
      }
    }
  }

  private stopIdleTimer() {
    clearInterval(this.idleInterval)
  }

  private startTour() {
    if (this.tour) {
      if (!this.tour.state.isTourActive) {
        this.tour.start()
      }
    } else {
      let root = document.createElement('div')
      document.body.appendChild(root)
      this.tour = render(<UserTour application={this}/>, root)
    }
  }

  private resetTimer() {
    // Only bother with resetting the timer if we're logged in
    if (this.props.user.isLoggedIn && !this.props.user.isSessionExpired) {
      const timeSinceLastActivity = moment().utc().diff(moment(localStorage.getItem(SESSION_IDLE_STORE)), SESSION_IDLE_UNITS)
      // Only reset the timer if we're more than a minute out of date
      if (timeSinceLastActivity > 0) {
        localStorage.setItem(SESSION_IDLE_STORE, moment().utc().format())
      }
    }
  }

  private startBackgroundTasks() {
    sessionService.onExpired(this.props.userSessionExpired)

    console.log('(application:startBackgroundTasks) starting job/productline polling at %s second intervals', Math.ceil(RECORD_POLLING_INTERVAL / 1000))
    this.pollingInstance = setInterval(this.refreshRecords.bind(this), RECORD_POLLING_INTERVAL)
  }

  private stopBackgroundTasks() {

    console.log('(application:stopBackgroundTasks) stopping job/productline polling')
    clearInterval(this.pollingInstance)
  }

  private subscribeToHistoryEvents() {
    window.addEventListener('popstate', () => {
      if (this.props.route.href !== location.pathname + location.search + location.hash) {
        this.props.routeNavigateTo(location, false)
      }
    })
  }

  private generateInitialState(): State {
    const state: State = {
      // Services
      geoserver: {},

      // Data Collections
      productLines: createCollection(),

      // Search state
      isSearching: false,
      searchCriteria: createSearchCriteria(),
      searchError: null,
      searchResults: null,
    }

    const deserializedState = deserialize()
    for (const key in deserializedState) {
      state[key] = deserializedState[key] || state[key]
    }

    return state
  }

  private serialize() {
    sessionStorage.setItem('geoserver', JSON.stringify(this.state.geoserver))
    sessionStorage.setItem('searchCriteria', JSON.stringify(this.state.searchCriteria))
    sessionStorage.setItem('searchResults', JSON.stringify(this.state.searchResults))

    this.props.userSerialize()
    this.props.catalogSerialize()
    this.props.mapSerialize()
    this.props.enabledPlatformsSerialize()
    this.props.algorithmsSerialize()
  }

  private deserialize() {
    this.props.userDeserialize()
    this.props.catalogDeserialize()
    this.props.mapDeserialize()
    this.props.enabledPlatformsDeserialize()
    this.props.algorithmsDeserialize()
  }
}

//
// Helpers
//

function deserialize(): State {
  return {
    geoserver:        JSON.parse(sessionStorage.getItem('geoserver')),
    searchCriteria:   JSON.parse(sessionStorage.getItem('searchCriteria')),
    searchResults:    JSON.parse(sessionStorage.getItem('searchResults')),
  }
}

function isElementInViewport(elem): boolean {
  const box = elem.getBoundingClientRect()
  const bannerHeight = 25
  const minimumBoxHeight = 65
  const client = {
    height: (window.innerHeight || document.documentElement.clientHeight),
    width: (window.innerWidth || document.documentElement.clientWidth),
  }

  return box.top >= bannerHeight
    && box.top + minimumBoxHeight < client.height - bannerHeight
}

function query(selector: string): HTMLElement {
  return document.querySelector(selector) as HTMLElement
}

function scrollIntoView(selector: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let elem = typeof selector === 'string' ? query(selector) : selector

    if (elem) {
      if (isElementInViewport(elem)) {
        resolve()
      } else {
        elem.scrollIntoView(true, { behavior: 'smooth' })

        let timeout = 10000
        let t0 = Date.now()
        let interval = setInterval(() => {
          if (isElementInViewport(elem)) {
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

function mapStateToProps(state: AppState) {
  return {
    user: state.user,
    catalog: state.catalog,
    route: state.route,
    map: state.map,
    jobs: state.jobs,
    enabledPlatforms: state.enabledPlatforms,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    routeNavigateTo: (loc, pushHistory?) => dispatch(routeActions.navigateTo(loc, pushHistory)),
    userLogout: () => dispatch(userActions.logout()),
    userSessionExpired: () => dispatch(userActions.sessionExpired()),
    userSerialize: () => dispatch(userActions.serialize()),
    userDeserialize: () => dispatch(userActions.deserialize()),
    catalogSerialize: () => dispatch(catalogActions.serialize()),
    catalogDeserialize: () => dispatch(catalogActions.deserialize()),
    mapUpdateMode: () => dispatch(mapActions.updateMode()),
    mapUpdateDetections: () => dispatch(mapActions.updateDetections()),
    mapUpdateFrames: () => dispatch(mapActions.updateFrames()),
    mapSetSelectedFeature: (selectedFeature: beachfront.Job | beachfront.Scene | null) => (
      dispatch(mapActions.setSelectedFeature(selectedFeature))
    ),
    mapUpdateSelectedFeature: () => dispatch(mapActions.updateSelectedFeature()),
    mapSetHoveredFeature: (hoveredFeature: beachfront.Job | null) => (
      dispatch(mapActions.setHoveredFeature(hoveredFeature))
    ),
    mapPanToPoint: (point: [number, number], zoom?: number) => dispatch(mapActions.panToPoint(point, zoom)),
    mapPanToExtent: (extent: [number, number, number, number]) => dispatch(mapActions.panToExtent(extent)),
    mapSerialize: () => dispatch(mapActions.serialize()),
    mapDeserialize: () => dispatch(mapActions.deserialize()),
    jobsFetch: () => dispatch(jobsActions.fetch()),
    jobsFetchOne: (jobId: string) => dispatch(jobsActions.fetchOne(jobId)),
    enabledPlatformsFetch: () => dispatch(enabledPlatformsActions.fetch()),
    enabledPlatformsSerialize: () => dispatch(enabledPlatformsActions.serialize()),
    enabledPlatformsDeserialize: () => dispatch(enabledPlatformsActions.deserialize()),
    algorithmsFetch: () => dispatch(algorithmsActions.fetch()),
    algorithmsSerialize: () => dispatch(algorithmsActions.serialize()),
    algorithmsDeserialize: () => dispatch(algorithmsActions.deserialize()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Application)
