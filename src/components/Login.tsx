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

const styles: any = require('./Login.css')
const brand: string = require('../images/brand-small-square.svg')

import {API_ROOT} from '../config'
import {CONSENT_BANNER_TEXT} from '../config'
import * as React from 'react'
import {Modal} from './Modal'

export const Login = () => (
  <Modal className={styles.parent} onDismiss={() => {/* noop */}} onInitialize={() => {/* noop */}}>
    <div className={styles.root}>
      <img src={brand} alt="Beachfront"/>
      <h1>Welcome to Beachfront!</h1>
      <div
        className={styles.warning}
        dangerouslySetInnerHTML={CONSENT_BANNER_TEXT}
      />
      <a className={styles.button} href={API_ROOT + '/login/geoaxis'}>
        <span className={styles.buttonIcons}>
            <span className="fa fa-lock"/>
        </span>
        Accept and Login with GEOAxIS
      </a>
    </div>
  </Modal>
)
