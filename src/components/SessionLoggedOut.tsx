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

const styles = require('./SessionLoggedOut.css')

import * as React from 'react'
import {connect} from 'react-redux'
import {Modal} from './Modal'
import {User} from '../actions/userActions'

type DispatchProps = ReturnType<typeof mapDispatchToProps>
type Props = DispatchProps

export class SessionLoggedOut extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    this.handleInitialize = this.handleInitialize.bind(this)
  }

  render() {
    return (
      <Modal onDismiss={() => { /*  Do nothing */ }} onInitialize={this.handleInitialize}>
        <div className={styles.root}>
          <h1><i className="fa fa-lock"/> You have successfully signed out</h1>
          <p>You are now signed out of Beachfront.</p>
          <p className={styles.instructions}>
            Click anywhere or press <kbd>ESC</kbd> to return to the login page
          </p>
        </div>
      </Modal>
    )
  }

  private handleInitialize() {
    this.props.dispatch.user.sessionLogout()
  }
}

function mapDispatchToProps(dispatch: Function) {
  return {
    dispatch: {
      user: {
        sessionLogout: () => dispatch(User.sessionLogout()),
      },
    },
  }
}

export default connect<undefined, DispatchProps>(
  undefined,
  mapDispatchToProps,
)(SessionLoggedOut)
