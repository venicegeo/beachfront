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

const styles: any = require('./Application.css')

import * as React from 'react'
import {render} from 'react-dom'
import {connect} from 'react-redux'
import * as debounce from 'lodash/debounce'
import * as moment from 'moment'
import About from './About'
import {BrowserSupport} from './BrowserSupport'
import {ClassificationBanner} from './ClassificationBanner'
import CreateJob from './CreateJob'
import CreateProductLine from './CreateProductLine'
import JobStatusList from './JobStatusList'
import {Login} from './Login'
import Navigation from './Navigation'
import PrimaryMap from './PrimaryMap'
import ProductLineList from './ProductLineList'
import SessionExpired from './SessionExpired'
import SessionLoggedOut from './SessionLoggedOut'
import * as sessionService from '../api/session'
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
import UserTour from './UserTour'

import {
  TYPE_JOB,
} from '../constants'
import {UserState} from '../reducers/userReducer'
import {userActions} from '../actions/userActions'
import {CatalogState} from '../reducers/catalogReducer'
import {catalogActions, CatalogSearchArgs} from '../actions/catalogActions'
import {RouteState} from '../reducers/routeReducer'
import {RouteNavigateToArgs, routeActions} from '../actions/routeActions'
import {mapActions, MapPanToPointArgs} from '../actions/mapActions'
import {MapState} from '../reducers/mapReducer'
import {JobsState} from '../reducers/jobsReducer'
import {jobsActions} from '../actions/jobsActions'
import {AppState} from '../store'
import {algorithmsActions} from '../actions/algorithmsActions'
import {apiStatusActions} from '../actions/apiStatusActions'
import {ProductLinesState} from '../reducers/productLinesReducer'
import {shouldSelectedFeatureAutoDeselect} from '../utils/mapUtils'
import {scrollIntoView} from '../utils/domUtils'

interface Props {
  user?: UserState
  route?: RouteState
  catalog?: CatalogState
  map?: MapState
  jobs?: JobsState
  productLines?: ProductLinesState
  userLogin?(args): void
  userLogout?(): void
  userSessionExpired?(): void
  userSerialize?(): void
  userDeserialize?(): void
  routeNavigateTo?(args: RouteNavigateToArgs): void
  catalogInitialize?(): void
  catalogSearch?(): void
  catalogSerialize?(): void
  catalogDeserialize?(): void
  mapUpdateMode?(): void
  mapUpdateDetections?(): void
  mapUpdateFrames?(): void
  mapSetSelectedFeature?(feature: GeoJSON.Feature<any> | null): void
  mapPanToPoint?(args: MapPanToPointArgs): void
  mapPanToExtent?(extent: [number, number, number, number]): void
  mapSerialize?(): void
  mapDeserialize?(): void
  jobsFetch?(): void
  jobsFetchOne?(jobId: string): void
  algorithmsFetch?(): void
  algorithmsSerialize?(): void
  algorithmsDeserialize?(): void
  apiStatusFetch?(): void
  apiStatusSerialize?(): void
  apiStatusDeserialize?(): void
}

export class Application extends React.Component<Props, null> {
  refs: any
  private pollingInstance: number
  private idleInterval: any
  private tour: any

  constructor(props) {
    super(props)
    this.importJobsIfNeeded = this.importJobsIfNeeded.bind(this)
    this.handleNavigateToJob = this.handleNavigateToJob.bind(this)
    this.handleSignOutClick = this.handleSignOutClick.bind(this)
    this.startIdleTimer = this.startIdleTimer.bind(this)
    this.stopIdleTimer = this.stopIdleTimer.bind(this)
    this.startTour = this.startTour.bind(this)
    this.timerIncrement = this.timerIncrement.bind(this)
    this.resetTimer = this.resetTimer.bind(this)
    this.serialize = debounce(this.serialize.bind(this), 500)
  }

  componentDidUpdate(prevProps: Props) {
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

      // Update selected feature if needed.
      let selectedFeature = this.props.map.selectedFeature
      if (this.props.route.jobIds.length) {
        selectedFeature = this.props.jobs.records.find(j => this.props.route.jobIds.includes(j.id))
      } else if (this.props.route.selectedFeature) {
        selectedFeature = this.props.route.selectedFeature
      } else {
        const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
        if (shouldDeselect) {
          selectedFeature = null
        }
      }

      this.props.mapSetSelectedFeature(selectedFeature)
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
        location: {
          pathname: this.props.route.pathname,
          search,
        },
      })
    }

    if (prevProps.jobs.isFetching && !this.props.jobs.isFetching && !this.props.jobs.fetchError) {
      // Load selected feature if it isn't already (e.g., page refresh w/ jobId).
      let [jobId] = this.props.route.jobIds

      if (jobId && !this.props.map.selectedFeature) {
        this.props.mapSetSelectedFeature(this.props.jobs.records.find(job => job.id === jobId))
      }

      this.importJobsIfNeeded()
    }

    if (prevProps.jobs.isFetchingOne && !this.props.jobs.isFetchingOne && !this.props.jobs.fetchOneError) {
      this.props.mapPanToPoint({
        point: getFeatureCenter(this.props.jobs.lastOneFetched),
      })
    }

    if (prevProps.jobs.isCreatingJob && !this.props.jobs.isCreatingJob && !this.props.jobs.createJobError) {
      this.props.routeNavigateTo({
        location: {
          pathname: '/jobs',
          search: '?jobId=' + this.props.jobs.createdJob.id,
        },
      })
    }

    if (prevProps.jobs.isDeletingJob && !this.props.jobs.isDeletingJob && !this.props.jobs.deleteJobError) {
      if (this.props.route.jobIds.includes(this.props.jobs.deletedJob.id)) {
        this.props.routeNavigateTo({
          location: {
            pathname: this.props.route.pathname,
            search: this.props.route.search.replace(new RegExp('\\??jobId=' + this.props.jobs.deletedJob.id), ''),
          },
        })
      }
    }

    if (prevProps.productLines.isCreatingProductLine &&
        !this.props.productLines.isCreatingProductLine &&
        !this.props.productLines.createProductLineError) {
      this.props.routeNavigateTo({
        location: {
          pathname: '/product-lines',
        },
      })
    }

    if (!prevProps.catalog.isSearching && this.props.catalog.isSearching) {
      const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
      if (shouldDeselect) {
        this.props.mapSetSelectedFeature(null)
      }
    }

    if (prevProps.catalog.isSearching && !this.props.catalog.isSearching && !this.props.catalog.searchError) {
      scrollIntoView('.ImagerySearchList-results')
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
          ref="map"
          shrunk={shrunk}
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
            mapRef={this.refs.map}
          />
        )
      case '/create-product-line':
        return (
          <CreateProductLine />
        )
      case '/jobs':
        return (
          <JobStatusList
            onNavigateToJob={this.handleNavigateToJob}
          />
        )
      case '/product-lines':
        return (
          <ProductLineList />
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
    this.props.apiStatusFetch()
    this.props.algorithmsFetch()
    this.props.catalogInitialize()
  }

  private handleNavigateToJob(loc) {
    this.props.routeNavigateTo(loc)
    const feature = this.props.jobs.records.find(j => loc.search.includes(j.id))
    this.props.mapPanToExtent(featureToExtentWrapped(this.props.map.map, feature))
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
      this.tour = render(<UserTour />, root)
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
        this.props.routeNavigateTo({
          location,
          pushHistory: false,
        })
      }
    })
  }

  private serialize() {
    this.props.userSerialize()
    this.props.catalogSerialize()
    this.props.mapSerialize()
    this.props.algorithmsSerialize()
    this.props.apiStatusSerialize()
  }

  private deserialize() {
    this.props.userDeserialize()
    this.props.catalogDeserialize()
    this.props.mapDeserialize()
    this.props.algorithmsDeserialize()
    this.props.apiStatusDeserialize()
  }
}

//
// Helpers
//

function mapStateToProps(state: AppState) {
  return {
    user: state.user,
    catalog: state.catalog,
    route: state.route,
    map: state.map,
    jobs: state.jobs,
    productLines: state.productLines,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    routeNavigateTo: (args: RouteNavigateToArgs) => dispatch(routeActions.navigateTo(args)),
    userLogout: () => dispatch(userActions.logout()),
    userSessionExpired: () => dispatch(userActions.sessionExpired()),
    userSerialize: () => dispatch(userActions.serialize()),
    userDeserialize: () => dispatch(userActions.deserialize()),
    catalogInitialize: () => dispatch(catalogActions.initialize()),
    catalogSearch: (args: CatalogSearchArgs) => dispatch(catalogActions.search(args)),
    catalogSerialize: () => dispatch(catalogActions.serialize()),
    catalogDeserialize: () => dispatch(catalogActions.deserialize()),
    mapUpdateMode: () => dispatch(mapActions.updateMode()),
    mapUpdateDetections: () => dispatch(mapActions.updateDetections()),
    mapUpdateFrames: () => dispatch(mapActions.updateFrames()),
    mapSetSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(mapActions.setSelectedFeature(feature)),
    mapPanToPoint: (args: MapPanToPointArgs) => dispatch(mapActions.panToPoint(args)),
    mapPanToExtent: (extent: [number, number, number, number]) => dispatch(mapActions.panToExtent(extent)),
    mapSerialize: () => dispatch(mapActions.serialize()),
    mapDeserialize: () => dispatch(mapActions.deserialize()),
    jobsFetch: () => dispatch(jobsActions.fetch()),
    jobsFetchOne: (jobId: string) => dispatch(jobsActions.fetchOne(jobId)),
    algorithmsFetch: () => dispatch(algorithmsActions.fetch()),
    algorithmsSerialize: () => dispatch(algorithmsActions.serialize()),
    algorithmsDeserialize: () => dispatch(algorithmsActions.deserialize()),
    apiStatusFetch: () => dispatch(apiStatusActions.fetch()),
    apiStatusSerialize: () => dispatch(apiStatusActions.serialize()),
    apiStatusDeserialize: () => dispatch(apiStatusActions.deserialize()),
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Application)
