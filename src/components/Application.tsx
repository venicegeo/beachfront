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
import {connect} from 'react-redux'
import debounce = require('lodash/debounce')
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
import {Extent, getFeatureCenter} from '../utils/geometries'
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
import {userActions} from '../actions/userActions'
import {catalogActions, CatalogSearchArgs} from '../actions/catalogActions'
import {RouteNavigateToArgs, routeActions} from '../actions/routeActions'
import {mapActions, MapPanToPointArgs} from '../actions/mapActions'
import {jobsActions} from '../actions/jobsActions'
import {AppState} from '../store'
import {algorithmsActions} from '../actions/algorithmsActions'
import {apiStatusActions} from '../actions/apiStatusActions'
import {shouldSelectedFeatureAutoDeselect} from '../utils/mapUtils'
import {scrollIntoView} from '../utils/domUtils'

type StateProps = Partial<ReturnType<typeof mapStateToProps>>
type DispatchProps = Partial<ReturnType<typeof mapDispatchToProps>>
type PassedProps = {}

type Props = PassedProps & StateProps & DispatchProps

export class Application extends React.Component<Props> {
  refs: any
  private pollingInstance: any
  private idleInterval: any

  constructor(props: Props) {
    super(props)
    this.importJobsIfNeeded = this.importJobsIfNeeded.bind(this)
    this.startIdleTimer = this.startIdleTimer.bind(this)
    this.stopIdleTimer = this.stopIdleTimer.bind(this)
    this.timerIncrement = this.timerIncrement.bind(this)
    this.resetTimer = this.resetTimer.bind(this)
    this.serialize = debounce(this.serialize.bind(this), 500)
  }

  componentDidUpdate(prevProps: Props) {
    // Logged in.
    if (!prevProps.user.isLoggedIn && this.props.user.isLoggedIn) {
      this.initializeServices()
      this.startBackgroundTasks()
      this.refreshRecords()
    }

    // Session expired.
    if (!prevProps.user.isSessionExpired && this.props.user.isSessionExpired || prevProps.user.isLoggedIn && !this.props.user.isLoggedIn) {
      this.stopBackgroundTasks()
      this.stopIdleTimer()
    }

    // Map context changed.
    if (prevProps.route.pathname !== this.props.route.pathname ||
        prevProps.map.bbox !== this.props.map.bbox ||
        prevProps.catalog.searchResults !== this.props.catalog.searchResults) {
      this.props.actions.map.updateMode()
    }

    // Route changed.
    if (prevProps.route !== this.props.route) {
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

      this.props.actions.map.setSelectedFeature(selectedFeature)
    }

    // Map data refreshed.
    if (prevProps.map.mode !== this.props.map.mode ||
        prevProps.map.selectedFeature !== this.props.map.selectedFeature ||
        prevProps.jobs !== this.props.jobs ||
        prevProps.route !== this.props.route) {
      this.props.actions.map.updateDetections()
      this.props.actions.map.updateFrames()
    }

    // Selected feature changed.
    if (prevProps.map.selectedFeature !== this.props.map.selectedFeature) {
      let search = ''
      if (this.props.map.selectedFeature && this.props.map.selectedFeature.properties.type === TYPE_JOB) {
        search = `?jobId=${this.props.map.selectedFeature.id}`
      }

      this.props.actions.route.navigateTo({
        loc: {
          pathname: this.props.route.pathname,
          search,
          selectedFeature: this.props.map.selectedFeature,
        },
      })
    }

    // Jobs fetched successfully.
    if (prevProps.jobs.isFetching && !this.props.jobs.isFetching && !this.props.jobs.fetchError) {
      // Load selected feature if it isn't already (e.g., page refresh w/ jobId).
      let [jobId] = this.props.route.jobIds

      if (jobId && !this.props.map.selectedFeature) {
        this.props.actions.map.setSelectedFeature(this.props.jobs.records.find(job => job.id === jobId))
      }

      this.importJobsIfNeeded()
    }

    // Single job fetched successfully.
    if (prevProps.jobs.isFetchingOne && !this.props.jobs.isFetchingOne && !this.props.jobs.fetchOneError) {
      this.props.actions.map.panToPoint({
        point: getFeatureCenter(this.props.jobs.lastOneFetched),
      })
    }

    // Job created successfully.
    if (prevProps.jobs.isCreatingJob && !this.props.jobs.isCreatingJob && !this.props.jobs.createJobError) {
      this.props.actions.route.navigateTo({
        loc: {
          pathname: '/jobs',
          search: '?jobId=' + this.props.jobs.createdJob.id,
        },
      })
    }

    // Job deleted successfully.
    if (prevProps.jobs.isDeletingJob && !this.props.jobs.isDeletingJob && !this.props.jobs.deleteJobError) {
      if (this.props.route.jobIds.includes(this.props.jobs.deletedJob.id)) {
        this.props.actions.route.navigateTo({
          loc: {
            pathname: this.props.route.pathname,
            search: this.props.route.search.replace(new RegExp('\\??jobId=' + this.props.jobs.deletedJob.id), ''),
          },
        })
      }
    }

    // Product line created successfully.
    if (prevProps.productLines.isCreatingProductLine &&
        !this.props.productLines.isCreatingProductLine &&
        !this.props.productLines.createProductLineError) {
      this.props.actions.route.navigateTo({
        loc: {
          pathname: '/product-lines',
        },
      })
    }

    // Search started.
    if (!prevProps.catalog.isSearching && this.props.catalog.isSearching) {
      const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
      if (shouldDeselect) {
        this.props.actions.map.setSelectedFeature(null)
      }
    }

    // Search completed successfully.
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

    this.props.actions.map.updateMode()
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
        <BrowserSupport />
        <Navigation
          shrunk={shrunk}
        />
        <PrimaryMap
          ref="map"
          shrunk={shrunk}
        />
        {this.renderRoute()}
        {this.props.user.isSessionExpired && (
          <SessionExpired />
        )}
        {this.props.user.isSessionLoggedOut && (
          <SessionLoggedOut />
        )}
        <ClassificationBanner anchor="bottom"/>
        <UserTour/>
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
          <JobStatusList />
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
      this.props.actions.jobs.fetchOne(jobId)
    })
  }

  private initializeServices() {
    this.props.actions.apiStatus.fetch()
    this.props.actions.algorithms.fetch()
    this.props.actions.catalog.initialize()
  }

  private refreshRecords() {
    this.props.actions.jobs.fetch()
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
        this.props.actions.user.logout()
      }
    }
  }

  private stopIdleTimer() {
    clearInterval(this.idleInterval)
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
    sessionService.onExpired(this.props.actions.user.sessionExpired)

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
        this.props.actions.route.navigateTo({
          loc: location,
          pushHistory: false,
        })
      }
    })
  }

  private serialize() {
    this.props.actions.user.serialize()
    this.props.actions.catalog.serialize()
    this.props.actions.map.serialize()
    this.props.actions.algorithms.serialize()
    this.props.actions.apiStatus.serialize()
  }

  private deserialize() {
    this.props.actions.user.deserialize()
    this.props.actions.catalog.deserialize()
    this.props.actions.map.deserialize()
    this.props.actions.algorithms.deserialize()
    this.props.actions.apiStatus.deserialize()
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
    actions: {
      route: {
        navigateTo: (args: RouteNavigateToArgs) => dispatch(routeActions.navigateTo(args)),
      },
      user: {
        logout: () => dispatch(userActions.logout()),
        sessionExpired: () => dispatch(userActions.sessionExpired()),
        serialize: () => dispatch(userActions.serialize()),
        deserialize: () => dispatch(userActions.deserialize()),
      },
      catalog: {
        initialize: () => dispatch(catalogActions.initialize()),
        search: (args: CatalogSearchArgs) => dispatch(catalogActions.search(args)),
        serialize: () => dispatch(catalogActions.serialize()),
        deserialize: () => dispatch(catalogActions.deserialize()),
      },
      map: {
        updateMode: () => dispatch(mapActions.updateMode()),
        updateDetections: () => dispatch(mapActions.updateDetections()),
        updateFrames: () => dispatch(mapActions.updateFrames()),
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(mapActions.setSelectedFeature(feature)),
        panToPoint: (args: MapPanToPointArgs) => dispatch(mapActions.panToPoint(args)),
        panToExtent: (extent: Extent) => dispatch(mapActions.panToExtent(extent)),
        serialize: () => dispatch(mapActions.serialize()),
        deserialize: () => dispatch(mapActions.deserialize()),
      },
      jobs: {
        fetch: () => dispatch(jobsActions.fetch()),
        fetchOne: (jobId: string) => dispatch(jobsActions.fetchOne(jobId)),
      },
      algorithms: {
        fetch: () => dispatch(algorithmsActions.fetch()),
        serialize: () => dispatch(algorithmsActions.serialize()),
        deserialize: () => dispatch(algorithmsActions.deserialize()),
      },
      apiStatus: {
        fetch: () => dispatch(apiStatusActions.fetch()),
        serialize: () => dispatch(apiStatusActions.serialize()),
        deserialize: () => dispatch(apiStatusActions.deserialize()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps, PassedProps>(
  mapStateToProps,
  mapDispatchToProps,
)(Application)
