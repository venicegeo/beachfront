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

const styles = require('./ProductLine.css')

import * as React from 'react'
import {connect} from 'react-redux'
import * as moment from 'moment'
import ActivityTable from './ActivityTable'
import {ProductLinesFetchJobsArgs, ProductLines} from '../actions/productLinesActions'
import {Map} from '../actions/mapActions'
import {getFeatureCenter, Point} from '../utils/geometries'

const LAST_24_HOURS = {value: 'PT24H', label: 'Last 24 Hours'}
const LAST_7_DAYS = {value: 'P7D', label: 'Last 7 Days'}
const LAST_30_DAYS = {value: 'P30D', label: 'Last 30 Days'}
const SINCE_CREATION = {value: 'P0D', label: 'All'}

type DispatchProps = ReturnType<typeof mapDispatchToProps>
type PassedProps = {
  className?: string
  productLine: beachfront.ProductLine
}
type Props = DispatchProps & PassedProps

interface State {
  duration: string
  isExpanded: boolean
  selectedJobs: beachfront.Job[]
}

export class ProductLine extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      duration: LAST_24_HOURS.value,
      isExpanded: false,
      selectedJobs: [],
    }
    this.handleDurationChange = this.handleDurationChange.bind(this)
    this.handleExpansionToggle = this.handleExpansionToggle.bind(this)
    this.handleJobRowClick = this.handleJobRowClick.bind(this)
    this.handleViewOnMap = this.handleViewOnMap.bind(this)
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.isExpanded && (prevState.isExpanded !== this.state.isExpanded || prevState.duration !== this.state.duration)) {
      this.props.dispatch.productLines.fetchJobs({
        productLineId: this.props.productLine.id,
        sinceDate: generateSinceDate(this.state.duration, this.props.productLine),
      })
    }
    if (prevState.isExpanded && !this.state.isExpanded && this.state.selectedJobs.length) {
      this.props.dispatch.map.setSelectedFeature(null)
    }
  }

  render() {
    const {className, productLine} = this.props
    const {properties} = productLine
    const {isExpanded, duration} = this.state
    return (
      <li className={`${styles.root} ${className || ''} ${isExpanded ? styles.isExpanded : ''}`}>
        <section className={styles.header} onClick={this.handleExpansionToggle}>
          <h3 className={styles.title}>
            <i className={`fa fa-chevron-right ${styles.caret}`}/>
            <span>{properties.name}</span>
          </h3>
          <div className={styles.controls}>
            <a onClick={this.handleViewOnMap} title="View on Map">
              <i className="fa fa-globe"/>
            </a>
          </div>
        </section>
        <section className={styles.details}>
          <div className={styles.metadata}>
            <dl>
              <dt>Scheduling</dt>
              <dd>{formatDate(properties.start_on)} &mdash; {formatDate(properties.stop_on) || 'Forever'}</dd>
              <dt>Algorithm</dt>
              <dd>{properties.algorithm_name}</dd>
              <dt>Cloud Cover</dt>
              <dd>{properties.max_cloud_cover}% or less</dd>
              {/*
              <dt>Compute Mask</dt>
              <dd>{computeMask}</dd>
              */}
              <dt>Spatial Filter</dt>
              <dd>{properties.spatial_filter_id || 'None'}</dd>
              <dt>Owner</dt>
              <dd>{properties.owned_by}</dd>
              <dt>Date Created</dt>
              <dd>{formatDate(properties.created_on)}</dd>
            </dl>
          </div>
          <ActivityTable
            className={styles.activityTable}
            duration={duration}
            durations={[
              LAST_24_HOURS,
              LAST_7_DAYS,
              LAST_30_DAYS,
              SINCE_CREATION,
            ]}
            selectedJobIds={this.state.selectedJobs.map(j => j.id)}
            onDurationChange={this.handleDurationChange}
            onRowClick={this.handleJobRowClick}
          />
        </section>
      </li>
    )
  }

  private handleDurationChange(duration: string) {
    this.setState({ duration })
  }

  private handleExpansionToggle() {
    this.setState({ isExpanded: !this.state.isExpanded })
    // TODO -- scroll to positioning
  }

  private handleJobRowClick(job: beachfront.Job) {
    if (this.state.selectedJobs.some(j => j.id === job.id)) {
      this.props.dispatch.map.setSelectedFeature(null)
      this.setState({ selectedJobs: [] })
    }
    else {
      this.props.dispatch.map.setSelectedFeature(job)
      this.setState({ selectedJobs: [job] })
    }
  }

  private handleViewOnMap() {
    this.props.dispatch.map.panToPoint({
      point: getFeatureCenter(this.props.productLine),
      zoom: 3.5,
    })
  }
}

//
// Helpers
//

function formatDate(input: string) {
  const date = moment(input)
  if (date.isValid()) {
    return date.format('MM/DD/YYYY')
  }
  return null
}

function generateSinceDate(offset: string, productLine: beachfront.ProductLine) {
  if (offset === SINCE_CREATION.value) {
    return productLine.properties.created_on
  }
  return moment()
    .utc()
    .subtract(moment.duration(offset))
    .startOf(offset === LAST_24_HOURS.value ? 'hour' : 'day')
    .toISOString()
}

function mapDispatchToProps(dispatch: Function) {
  return {
    dispatch: {
      productLines: {
        fetchJobs: (args: ProductLinesFetchJobsArgs) => dispatch(ProductLines.fetchJobs(args)),
      },
      map: {
        setSelectedFeature: (feature: GeoJSON.Feature<any> | null) => dispatch(Map.setSelectedFeature(feature)),
        panToPoint: (args: { point: Point, zoom?: number }) => dispatch(Map.panToPoint(args)),
      },
    },
  }
}

export default connect<undefined, DispatchProps, PassedProps>(
  undefined,
  mapDispatchToProps,
)(ProductLine)
