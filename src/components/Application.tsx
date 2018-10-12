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
import {catalogActions} from '../actions/catalogActions'

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
import {JobStatusList} from './JobStatusList'
import {Login} from './Login'
import Navigation from './Navigation'
import PrimaryMap, {
  MapView,
  MODE_DRAW_BBOX,
  MODE_NORMAL,
  MODE_SELECT_IMAGERY,
  MODE_PRODUCT_LINES,
} from './PrimaryMap'
import {ProductLineList} from './ProductLineList'
import SessionExpired from './SessionExpired'
import SessionLoggedOut from './SessionLoggedOut'
import * as algorithmsService from '../api/algorithms'
import * as catalogService from '../api/catalog'
import * as geoserverService from '../api/geoserver'
import * as jobsService from '../api/jobs'
import * as productLinesService from '../api/productLines'
import * as sessionService from '../api/session'
import * as statusService from '../api/status'
import * as ol from '../utils/ol'
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
import {wrap} from '../utils/math'

import {
  TYPE_JOB,
  TYPE_SCENE,
} from '../constants'
import {UserState} from '../reducers/userReducer'
import {userActions} from '../actions/userActions'
import {CatalogState} from '../reducers/catalogReducer'
import {RouteState} from '../reducers/routeReducer'
import {routeActions} from '../actions/routeActions'

interface Props {
  user?: UserState
  catalog?: CatalogState
  route?: RouteState
  login?(args): void
  logout?(): void
  navigateTo?(loc, pushHistory?: boolean): void
  sessionExpired?(): void
}

interface State {
  // Services
  geoserver?: geoserverService.Descriptor

  // Data Collections
  enabledPlatforms?: Collection<string>
  algorithms?: Collection<beachfront.Algorithm>
  jobs?: Collection<beachfront.Job>
  productLines?: Collection<beachfront.ProductLine>

  // Map state
  map?: ol.Map
  mapMode?: string
  detections?: (beachfront.Job | beachfront.ProductLine)[]
  frames?: (beachfront.Job | beachfront.ProductLine)[]
  bbox?: [number, number, number, number]
  mapView?: MapView
  hoveredFeature?: beachfront.Job
  collections?: any
  selectedFeature?: beachfront.Job | beachfront.Scene

  // Search state
  isSearching?: boolean
  searchCriteria?: SearchCriteria
  searchError?: any
  searchResults?: beachfront.ImageryCatalogPage
}

export class Application extends React.Component<Props, State> {
  refs: any
  readonly serialize: any
  private initializationPromise: Promise<any>
  private pollingInstance: number
  private idleInterval: any
  private tour: any

  constructor(props) {
    super(props)
    this.generateInitialState = this.generateInitialState.bind(this)
    this.handleMapInitialization = this.handleMapInitialization.bind(this)
    this.handleBoundingBoxChange = this.handleBoundingBoxChange.bind(this)
    this.handleClearBbox = this.handleClearBbox.bind(this)
    this.handleDismissJobError = this.handleDismissJobError.bind(this)
    this.handleDismissProductLineError = this.handleDismissProductLineError.bind(this)
    this.handleForgetJob = this.handleForgetJob.bind(this)
    this.handleJobCreated = this.handleJobCreated.bind(this)
    this.handleNavigateToJob = this.handleNavigateToJob.bind(this)
    this.handlePanToProductLine = this.handlePanToProductLine.bind(this)
    this.handleProductLineCreated = this.handleProductLineCreated.bind(this)
    this.handleProductLineJobHoverIn = this.handleProductLineJobHoverIn.bind(this)
    this.handleProductLineJobHoverOut = this.handleProductLineJobHoverOut.bind(this)
    this.handleProductLineJobSelect = this.handleProductLineJobSelect.bind(this)
    this.handleProductLineJobDeselect = this.handleProductLineJobDeselect.bind(this)
    this.handleSearchCriteriaChange = this.handleSearchCriteriaChange.bind(this)
    this.handleSearchSubmit = this.handleSearchSubmit.bind(this)
    this.handleSelectFeature = this.handleSelectFeature.bind(this)
    this.handleSignOutClick = this.handleSignOutClick.bind(this)
    this.shouldSelectedFeatureAutoDeselect = this.shouldSelectedFeatureAutoDeselect.bind(this)
    this.updateSelectedFeature = this.updateSelectedFeature.bind(this)
    this.panTo = this.panTo.bind(this)
    this.panToExtent = this.panToExtent.bind(this)
    this.startIdleTimer = this.startIdleTimer.bind(this)
    this.stopIdleTimer = this.stopIdleTimer.bind(this)
    this.startTour = this.startTour.bind(this)
    this.timerIncrement = this.timerIncrement.bind(this)
    this.resetTimer = this.resetTimer.bind(this)

    this.state = this.generateInitialState()

    this.serialize = debounce(serialize, 500)
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
          prevState.bbox !== this.state.bbox ||
          prevState.searchResults !== this.state.searchResults) {
        this.updateMapMode()
      }

      if (prevProps.route.jobIds.join(',') !== this.props.route.jobIds.join(',')) {
        this.importJobsIfNeeded()
      }

      this.updateSelectedFeature()
    }

    if (prevState.mapMode !== this.state.mapMode ||
        prevState.selectedFeature !== this.state.selectedFeature ||
        prevState.jobs !== this.state.jobs) {
      this.updateDetections()
      this.updateFrames()
    }

    this.serialize(this.state)
  }

  componentWillMount() {
    this.subscribeToHistoryEvents()
    if (this.props.user.isLoggedIn && !this.props.user.isSessionExpired) {
      this.initializeServices()
      this.startBackgroundTasks()
      this.refreshRecords().then(() => {
        // Load selected feature if it isn't already (e.g., page refresh w/ jobId).
        let [jobId] = this.props.route.jobIds

        if (jobId && !this.state.selectedFeature) {
          this.setState({ selectedFeature: this.state.jobs.records.find(job => job.id === jobId) })
        }
      }).then(this.importJobsIfNeeded.bind(this))
      this.startIdleTimer()
    }
  }

  componentDidMount() {
    document.addEventListener('mousemove', this.resetTimer)
    document.addEventListener('keyup', this.resetTimer)

    this.updateMapMode()
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
          bbox={this.state.bbox}
          detections={this.state.detections}
          frames={this.state.frames}
          highlightedFeature={this.state.hoveredFeature}
          imagery={this.state.searchResults}
          isSearching={this.state.isSearching}
          mode={this.state.mapMode}
          ref="map"
          jobs={this.state.jobs.records}
          selectedFeature={this.state.selectedFeature}
          shrunk={shrunk}
          view={this.state.mapView}
          wmsUrl={this.state.geoserver.wmsUrl}
          onBoundingBoxChange={this.handleBoundingBoxChange}
          onMapInitialization={this.handleMapInitialization}
          onSearchPageChange={this.handleSearchSubmit}
          onSelectFeature={this.handleSelectFeature}
          onViewChange={mapView => this.setState({ mapView })}
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
            algorithms={this.state.algorithms.records}
            enabledPlatforms={this.state.enabledPlatforms.records}
            bbox={this.state.bbox}
            collections={this.state.collections}
            imagery={this.state.searchResults}
            isSearching={this.state.isSearching}
            map={this.refs.map}
            searchCriteria={this.state.searchCriteria}
            searchError={this.state.searchError}
            selectedScene={this.state.selectedFeature && this.state.selectedFeature.properties.type === TYPE_SCENE ? this.state.selectedFeature as beachfront.Scene : null}
            onClearBbox={this.handleClearBbox}
            onJobCreated={this.handleJobCreated}
            onSearchCriteriaChange={this.handleSearchCriteriaChange}
            onSearchSubmit={this.handleSearchSubmit}
          />
        )
      case '/create-product-line':
        return (
          <CreateProductLine
            algorithms={this.state.algorithms.records}
            bbox={this.state.bbox}
            enabledPlatforms={this.state.enabledPlatforms.records}
            onClearBbox={this.handleClearBbox}
            onProductLineCreated={this.handleProductLineCreated}
          />
        )
      case '/jobs':
        return (
          <JobStatusList
            activeIds={this.state.detections.map(d => d.id)}
            error={this.state.jobs.error}
            jobs={this.state.jobs.records}
            onDismissError={this.handleDismissJobError}
            onForgetJob={this.handleForgetJob}
            onNavigateToJob={this.handleNavigateToJob}
            onSelectJob={this.handleSelectFeature}
            selectedFeature={this.state.selectedFeature}
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

  private updateMapMode() {
    let mapMode: string
    switch (this.props.route.pathname) {
      case '/create-job':
        mapMode = this.state.bbox && this.state.searchResults ? MODE_SELECT_IMAGERY : MODE_DRAW_BBOX
        break
      case '/create-product-line':
        mapMode = MODE_DRAW_BBOX
        break
      case '/product-lines':
        mapMode = MODE_PRODUCT_LINES
        break
      default:
        mapMode = MODE_NORMAL
    }

    this.setState({ mapMode })
  }

  private updateDetections() {
    let detections: beachfront.Job[] | beachfront.ProductLine[]
    switch (this.props.route.pathname) {
      case '/create-product-line':
      case '/product-lines':
        detections = this.state.selectedFeature ? [this.state.selectedFeature as any] : this.state.productLines.records
        break
      default:
        detections = this.state.jobs.records.filter(j => this.props.route.jobIds.includes(j.id))
    }

    // Only update state if detections have changed so that we can avoid unnecessary redrawing.
    let detectionsChanged = false
    if (detections.length !== this.state.detections.length) {
      detectionsChanged = true
    } else {
      for (let i = 0; i < detections.length; i++) {
        if (detections[i] !== this.state.detections[i]) {
          detectionsChanged = true
          break
        }
      }
    }

    if (detectionsChanged) {
      this.setState({ detections })
    }
  }

  private updateFrames() {
    let frames: beachfront.Job[] | beachfront.ProductLine[]
    switch (this.props.route.pathname) {
      case '/create-product-line':
      case '/product-lines':
        frames = [this.state.selectedFeature as any, ...this.state.productLines.records].filter(Boolean)
        break
      default:
        frames = this.state.jobs.records
    }

    // Only update state if frames have changed so that we can avoid unnecessary redrawing.
    let framesChanged = false
    if (frames.length !== this.state.frames.length) {
      framesChanged = true
    } else {
      for (let i = 0; i < frames.length; i++) {
        if (frames[i] !== this.state.frames[i]) {
          framesChanged = true
          break
        }
      }
    }

    if (framesChanged) {
      this.setState({ frames })
    }
  }

  private importJobsIfNeeded() {
    this.props.route.jobIds.map(jobId => {
      if (this.state.jobs.records.find(j => j.id === jobId)) {
        return
      }
      console.log('(application:componentDidUpdate) fetching job %s', jobId)
      jobsService.fetchJob(jobId)
        .then(record => {
          this.setState({ jobs: this.state.jobs.$append(record) })
          this.panTo(getFeatureCenter(record))
        })
        .catch(err => {
          console.error('(application:fetch) failed:', err)
          throw err
        })
    })
  }

  private initializeServices() {
    this.initializationPromise = Promise.all([
      this.fetchEnabledPlatforms(),
      this.fetchAlgorithms(),
      this.fetchGeoserverConfig(),
      this.initializeCatalog(),
    ])
  }

  private fetchEnabledPlatforms() {
    this.setState({enabledPlatforms: this.state.enabledPlatforms.$fetching()})
    return statusService.getEnabledPlatforms()
      .then(sources => this.setState({enabledPlatforms: this.state.enabledPlatforms.$records(sources)}))
      .catch(err => this.setState({enabledPlatforms: this.state.enabledPlatforms.$error(err)}))
  }

  private fetchAlgorithms() {
    this.setState({ algorithms: this.state.algorithms.$fetching() })
    return algorithmsService.lookup()
      .then(algorithms => this.setState({ algorithms: this.state.algorithms.$records(algorithms) }))
      .catch(err => this.setState({ algorithms: this.state.algorithms.$error(err) }))
  }

  private fetchGeoserverConfig() {
    return geoserverService.lookup()
      .then(geoserver => this.setState({ geoserver }))
      // .catch(err => this.setState({ errors: [...this.props.errors, err] }))
  }

  private fetchJobs() {
    this.setState({ jobs: this.state.jobs.$fetching() })
    return jobsService.fetchJobs()
      .then(jobs => this.setState({ jobs: this.state.jobs.$records(jobs) }))
      .catch(err => this.setState({ jobs: this.state.jobs.$error(err) }))
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

  private handleMapInitialization(map: ol.Map, collections: any) {
    this.setState({
      map,
      collections,
    })
  }

  private handleBoundingBoxChange(bbox) {
    this.setState({
      bbox,
      searchError: null,
    })
  }

  private handleClearBbox() {
    let newState: any = {
      bbox: null,
      searchResults: null,
      searchError: null,
    }
    const shouldDeselect = this.shouldSelectedFeatureAutoDeselect({ ignoreTypes: [TYPE_JOB] })
    if (shouldDeselect) {
      newState.selectedFeature = null
    }

    this.setState(newState)
  }

  private handleDismissJobError() {
    this.setState({
      jobs: this.state.jobs.$error(null),
    })
    setTimeout(() => this.fetchJobs())
  }

  private handleDismissProductLineError() {
    this.setState({
      productLines: this.state.productLines.$error(null),
    })
    setTimeout(() => this.fetchProductLines())
  }

  private handleForgetJob(job: beachfront.Job) {
    this.setState({
      jobs: this.state.jobs.$filter(j => j.id !== job.id),
    })
    if (this.props.route.jobIds.includes(job.id)) {
      this.props.navigateTo({
        pathname: this.props.route.pathname,
        search: this.props.route.search.replace(new RegExp('\\??jobId=' + job.id), ''),
      })
    }
    jobsService.forgetJob(job.id)
      .catch(() => {
        this.setState({
          jobs: this.state.jobs.$append(job),
        })
      })
  }

  private handleJobCreated(job) {
    this.setState({
      jobs: this.state.jobs.$append(job),
    })
    this.props.navigateTo({
      pathname: '/jobs',
      search: '?jobId=' + job.id,
    })
  }

  private handleNavigateToJob(loc) {
    this.props.navigateTo(loc)
    const feature = this.state.jobs.records.find(j => loc.search.includes(j.id))
    this.panToExtent(featureToExtentWrapped(this.state.map, feature))
  }

  private handlePanToProductLine(productLine) {
    this.panTo(getFeatureCenter(productLine), 3.5)
  }

  private handleProductLineCreated(productLine: beachfront.ProductLine) {
    this.setState({
      productLines: this.state.productLines.$append(productLine),
    })
    this.props.navigateTo({ pathname: '/product-lines' })
  }

  private handleProductLineJobHoverIn(job) {
    this.setState({ hoveredFeature: job })
  }

  private handleProductLineJobHoverOut() {
    this.setState({ hoveredFeature: null })
  }

  private handleProductLineJobSelect(job) {
    this.setState({ selectedFeature: job })
  }

  private handleProductLineJobDeselect() {
    this.setState({ selectedFeature: null })
  }

  private handleSearchCriteriaChange(searchCriteria) {
    this.setState({ searchCriteria })
  }

  private handleSearchSubmit({startIndex = 0, count = 100} = {}) {
    let newState: any = { isSearching: true }
    const shouldDeselect = this.shouldSelectedFeatureAutoDeselect({ ignoreTypes: [TYPE_JOB] })
    if (shouldDeselect) {
      newState.selectedFeature = null
    }
    this.setState(newState)

    catalogService.search({
      count,
      startIndex,
      bbox: this.state.bbox,
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

  private handleSelectFeature(feature) {
    if (this.state.selectedFeature === feature) {
      return  // Nothing to do
    }

    this.props.navigateTo({
      pathname: this.props.route.pathname,
      search: feature && feature.properties.type === TYPE_JOB ? `?jobId=${feature.id}` : '',
      selectedFeature: feature,
    })
  }

  private handleSignOutClick() {
    if (confirm('Are you sure you want to sign out of Beachfront?')) {
      this.props.logout()
    }
  }

  // Determine if the selected feature is an ignorable type that should not be auto-deselected on certain route changes
  private shouldSelectedFeatureAutoDeselect(args: { ignoreTypes?: string[] } = {}) {
    args.ignoreTypes = args.ignoreTypes || []

    if (this.state.selectedFeature) {
      for (const type of args.ignoreTypes) {
        if (this.state.selectedFeature.properties.type === type) {
          return false
        }
      }
    };

    return true
  }

  private updateSelectedFeature() {
    let selectedFeature = this.state.selectedFeature

    // Update selected feature if needed.
    if (this.props.route.jobIds.length) {
      selectedFeature = this.state.jobs.records.find(j => this.props.route.jobIds.includes(j.id))
    } else if (this.props.route.selectedFeature) {
      selectedFeature = this.props.route.selectedFeature
    } else if (this.props.route.pathname !== this.props.route.pathname) {
      const shouldDeselect = this.shouldSelectedFeatureAutoDeselect({ ignoreTypes: [TYPE_JOB] })
      if (shouldDeselect) {
        selectedFeature = null
      }
    }

    this.setState({ selectedFeature })
  }

  private panTo(point, zoom = 10) {
    this.setState({
      mapView: Object.assign({}, this.state.mapView, {
        center: point,
        zoom,
        extent: null,
      }),
    })
  }

  private panToExtent(extent: [number, number, number, number]) {
    this.setState({
      mapView: {
        ...this.state.mapView,
        center: null,
        zoom: null,
        extent,
      },
    })
  }

  private refreshRecords() {
    return Promise.all([
      this.fetchJobs(),
      /*
       * No need to fetch product lines till we get them working.
      this.fetchProductLines(),
      */
    ])
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
        this.props.logout()
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
    sessionService.onExpired(this.props.sessionExpired)

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
        this.props.navigateTo(location, false)
      }
    })
  }

  private generateInitialState(): State {
    const state: State = {
      // Services
      geoserver: {},

      // Data Collections
      algorithms: createCollection(),
      jobs: createCollection(),
      productLines: createCollection(),

      // Map state
      mapMode: MODE_NORMAL,
      detections: [],
      frames: [],
      bbox: null,
      mapView: null,
      selectedFeature: null,

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

    const [jobId] = this.props.route.jobIds
    if (jobId) {
      // This code should never find a selected feature since no jobs have been loaded.
      state.selectedFeature = state.jobs.records.find(j => j.id === jobId) || null
    }

    return state
  }
}

//
// Helpers
//

function deserialize(): State {
  return {
    enabledPlatforms: createCollection(JSON.parse(sessionStorage.getItem('enabled_platforms_records')) || []),
    algorithms: createCollection(JSON.parse(sessionStorage.getItem('algorithms_records')) || []),
    bbox:             JSON.parse(sessionStorage.getItem('bbox')),
    geoserver:        JSON.parse(sessionStorage.getItem('geoserver')),
    mapView:          JSON.parse(sessionStorage.getItem('mapView')),
    searchCriteria:   JSON.parse(sessionStorage.getItem('searchCriteria')),
    searchResults:    JSON.parse(sessionStorage.getItem('searchResults')),
  }
}

function serialize(state: State) {
  /*
    Wrap map center to keep it within the -180/180 range. Otherwise the map may scroll awkardly on initial load to get
    back to a far away location. Do the same for the bbox so that it's in the same starting location as the map.
   */
  let mapView = null
  if (state.mapView) {
    mapView = {...state.mapView}
    if (mapView.center) {
      mapView.center[0] = wrap(mapView.center[0], -180, 180)
    }
  }

  let bbox = null
  if (state.bbox) {
    bbox = [...state.bbox]
    const bboxWidth = bbox[2] - bbox[0]
    bbox[0] = wrap(bbox[0], -180, 180)
    bbox[2] = bbox[0] + bboxWidth
  }

  sessionStorage.setItem('enabled_platforms_records', JSON.stringify(state.enabledPlatforms.records))
  sessionStorage.setItem('algorithms_records', JSON.stringify(state.algorithms.records))
  sessionStorage.setItem('bbox', JSON.stringify(bbox))
  sessionStorage.setItem('geoserver', JSON.stringify(state.geoserver))
  sessionStorage.setItem('mapView', JSON.stringify(mapView))
  sessionStorage.setItem('searchCriteria', JSON.stringify(state.searchCriteria))
  sessionStorage.setItem('searchResults', JSON.stringify(state.searchResults))

  this.props.serializeUser()
  this.props.serializeCatalog()
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

function mapStateToProps(state) {
  return {
    user: state.user,
    catalog: state.catalog,
    route: state.route,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    login: (args) => dispatch(userActions.login(args)),
    logout: () => dispatch(userActions.logout()),
    navigateTo: (loc, pushHistory?) => dispatch(routeActions.navigateTo(loc, pushHistory)),
    sessionExpired: () => dispatch(userActions.sessionExpired()),
    serializeUser: () => dispatch(userActions.serialize()),
    serializeCatalog: () => dispatch(catalogActions.serialize()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Application)
