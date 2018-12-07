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

const styles: any = require('./FeatureDetails.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {SceneFeatureDetails} from './SceneFeatureDetails'
import {AppState} from '../store'

import {
  TYPE_SCENE,
} from '../constants'

type StateProps = ReturnType<typeof mapStateToProps>
type Props = StateProps

export class FeatureDetails extends React.Component<Props> {
  render() {
    if (!this.props.map.selectedFeature) {
      return <div role="nothing-selected"/>
    }
    return (
      <div className={styles.root}>
        {this.props.map.selectedFeature.properties && this.props.map.selectedFeature.properties.type === TYPE_SCENE && (
          <SceneFeatureDetails
            className={styles.sceneDetails}
            feature={this.props.map.selectedFeature as beachfront.Scene}
          />
        )}
      </div>
    )
  }
}

function mapStateToProps(state: AppState) {
  return {
    map: state.map,
  }
}

export default connect<StateProps, undefined>(
  mapStateToProps,
)(FeatureDetails)
