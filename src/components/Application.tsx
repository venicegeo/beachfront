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
import {Extent, getFeatureCenter, Point} from '../utils/geometries'
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
import {User} from '../actions/userActions'
import {Catalog, CatalogSearchArgs} from '../actions/catalogActions'
import {RouteNavigateToArgs, Route} from '../actions/routeActions'
import {Map} from '../actions/mapActions'
import {Jobs} from '../actions/jobsActions'
import {AppState} from '../store'
import {Algorithms} from '../actions/algorithmsActions'
import {ApiStatus} from '../actions/apiStatusActions'
import {shouldSelectedFeatureAutoDeselect} from '../utils/mapUtils'
import {scrollIntoView} from '../utils/domUtils'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = ReturnType<typeof mapDispatchToProps>
type Props = StateProps & DispatchProps

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
      this.props.dispatch.map.updateMode()
    }

    // Route changed.
    if (prevProps.route !== this.props.route) {
      if (prevProps.route.jobIds.join(',') !== this.props.route.jobIds.join(',')) {
        this.importJobsIfNeeded()
      }

      // Update selected feature if needed.
      let selectedFeature = this.props.map.selectedFeature
      if (this.props.route.jobIds.length) {
        selectedFeature = this.props.jobs.records.find(j => this.props.route.jobIds.includes(j.id)) || null
      } else if (this.props.route.selectedFeature) {
        selectedFeature = this.props.route.selectedFeature
      } else {
        const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
        if (shouldDeselect) {
          selectedFeature = null
        }
      }

      this.props.dispatch.map.setSelectedFeature(selectedFeature)
    }

    // Map data refreshed.
    if (prevProps.map.mode !== this.props.map.mode ||
        prevProps.map.selectedFeature !== this.props.map.selectedFeature ||
        prevProps.jobs !== this.props.jobs ||
        prevProps.route !== this.props.route) {
      this.props.dispatch.map.updateDetections()
      this.props.dispatch.map.updateFrames()
    }

    // Selected feature changed.
    if (prevProps.map.selectedFeature !== this.props.map.selectedFeature) {
      let search = ''
      const selectedFeature = this.props.map.selectedFeature
      if (selectedFeature && selectedFeature.properties && selectedFeature.properties.type === TYPE_JOB) {
        search = `?jobId=${selectedFeature.id}`
      }

      this.props.dispatch.route.navigateTo({
        loc: {
          pathname: this.props.route.pathname,
          search,
          selectedFeature,
        },
      })
    }

    // Jobs fetched successfully.
    if (prevProps.jobs.isFetching && !this.props.jobs.isFetching && !this.props.jobs.fetchError) {
      // Load selected feature if it isn't already (e.g., page refresh w/ jobId).
      let [jobId] = this.props.route.jobIds

      if (jobId && !this.props.map.selectedFeature) {
        this.props.dispatch.map.setSelectedFeature(this.props.jobs.records.find(job => job.id === jobId) || null)
      }

      this.importJobsIfNeeded()
    }

    // Single job fetched successfully.
    if (prevProps.jobs.isFetchingOne && !this.props.jobs.isFetchingOne && !this.props.jobs.fetchOneError && this.props.jobs.lastOneFetched) {
      this.props.dispatch.map.panToPoint({
        point: getFeatureCenter(this.props.jobs.lastOneFetched),
      })
    }

    // Job created successfully.
    if (prevProps.jobs.isCreatingJob && !this.props.jobs.isCreatingJob && this.props.jobs.createdJob) {
      this.props.dispatch.route.navigateTo({
        loc: {
          pathname: '/jobs',
          search: '?jobId=' + this.props.jobs.createdJob.id,
        },
      })
    }

    // Job deleted successfully.
    if (prevProps.jobs.isDeletingJob && !this.props.jobs.isDeletingJob && !this.props.jobs.deleteJobError && this.props.jobs.deletedJob) {
      if (this.props.route.jobIds.includes(this.props.jobs.deletedJob.id)) {
        this.props.dispatch.route.navigateTo({
          loc: {
            pathname: this.props.route.pathname,
            search: this.props.route.search.replace(new RegExp('\\??jobId=' + this.props.jobs.deletedJob.id), ''),
          },
        })
      }

      if (this.props.map.selectedFeature && this.props.map.selectedFeature.id === this.props.jobs.deletedJob.id) {
        this.props.dispatch.map.setSelectedFeature(null)
      }
    }

    // Product line created successfully.
    if (prevProps.productLines.isCreatingProductLine &&
        !this.props.productLines.isCreatingProductLine &&
        !this.props.productLines.createProductLineError) {
      this.props.dispatch.route.navigateTo({
        loc: {
          pathname: '/product-lines',
        },
      })
    }

    // Search started.
    if (!prevProps.catalog.isSearching && this.props.catalog.isSearching) {
      const shouldDeselect = shouldSelectedFeatureAutoDeselect(this.props.map.selectedFeature, { ignoreTypes: [TYPE_JOB] })
      if (shouldDeselect) {
        this.props.dispatch.map.setSelectedFeature(null)
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

    this.props.dispatch.map.updateMode()
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
      this.props.dispatch.jobs.fetchOne(jobId)
    })
  }

  private initializeServices() {
    this.props.dispatch.apiStatus.fetch()
    this.props.dispatch.algorithms.fetch()
  }

  private refreshRecords() {
    this.props.dispatch.jobs.fetch()
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
      const lastActivity = moment(localStorage.getItem(SESSION_IDLE_STORE) || undefined)
      const timeSinceLast = moment().utc().diff(lastActivity, SESSION_IDLE_UNITS)
      if (timeSinceLast >= SESSION_IDLE_TIMEOUT) {
        this.props.dispatch.user.logout()
      }
    }
  }

  private stopIdleTimer() {
    clearInterval(this.idleInterval)
  }

  private resetTimer() {
    // Only bother with resetting the timer if we're logged in
    if (this.props.user.isLoggedIn && !this.props.user.isSessionExpired) {
      const timeSinceLastActivity = moment().utc().diff(moment(localStorage.getItem(SESSION_IDLE_STORE) || undefined), SESSION_IDLE_UNITS)
      // Only reset the timer if we're more than a minute out of date
      if (timeSinceLastActivity > 0) {
        localStorage.setItem(SESSION_IDLE_STORE, moment().utc().format())
      }
    }
  }

  private startBackgroundTasks() {
    sessionService.onExpired(this.props.dispatch.user.sessionExpired)

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
        this.props.dispatch.route.navigateTo({
          loc: location,
          pushHistory: false,
        })
      }
    })
  }

  private serialize() {
    this.props.dispatch.user.serialize()
    this.props.dispatch.catalog.serialize()
    this.props.dispatch.map.serialize()
    this.props.dispatch.algorithms.serialize()
    this.props.dispatch.apiStatus.serialize()
  }

  private deserialize() {
    this.props.dispatch.user.deserialize()
    this.props.dispatch.catalog.deserialize()
    this.props.dispatch.map.deserialize()
    this.props.dispatch.algorithms.deserialize()
    this.props.dispatch.apiStatus.deserialize()
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

function mapDispatchToProps(dispatch: Function) {
  return {
    dispatch: {
      route: {
        navigateTo: (args: RouteNavigateToArgs) => dispatch(Route.navigateTo(args)),
      },
      user: {
        logout: () => dispatch(User.logout()),
        sessionExpired: () => dispatch(User.sessionExpired()),
        serialize: () => dispatch(User.serialize()),
        deserialize: () => dispatch(User.deserialize()),
      },
      catalog: {
        search: (args: CatalogSearchArgs) => dispatch(Catalog.search(args)),
        serialize: () => dispatch(Catalog.serialize()),
        deserialize: () => dispatch(Catalog.deserialize()),
      },
      map: {
        updateMode: () => dispatch(Map.updateMode()),
        updateDetections: () => dispatch(Map.updateDetections()),
        updateFrames: () => dispatch(Map.updateFrames()),
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(Map.setSelectedFeature(feature)),
        panToPoint: (args: { point: Point, zoom?: number }) => dispatch(Map.panToPoint(args)),
        panToExtent: (extent: Extent) => dispatch(Map.panToExtent(extent)),
        serialize: () => dispatch(Map.serialize()),
        deserialize: () => dispatch(Map.deserialize()),
      },
      jobs: {
        fetch: () => dispatch(Jobs.fetch()),
        fetchOne: (jobId: string) => dispatch(Jobs.fetchOne(jobId)),
      },
      algorithms: {
        fetch: () => dispatch(Algorithms.fetch()),
        serialize: () => dispatch(Algorithms.serialize()),
        deserialize: () => dispatch(Algorithms.deserialize()),
      },
      apiStatus: {
        fetch: () => dispatch(ApiStatus.fetch()),
        serialize: () => dispatch(ApiStatus.serialize()),
        deserialize: () => dispatch(ApiStatus.deserialize()),
      },
    },
  }
}

export default connect<StateProps, DispatchProps>(
  mapStateToProps,
  mapDispatchToProps,
)(Application)
