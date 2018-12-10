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

// Styles
import 'font-awesome/css/font-awesome.css'
import './styles/webfonts/index.css'
import './styles/layout.css'
import './styles/colors.css'
import './styles/typography.css'
import './styles/forms.css'
import './styles/menus.css'

import './polyfills'

import * as React from 'react'
import {render} from 'react-dom'
import {Provider} from 'react-redux'
import Application from './components/Application'
import store from './store'
import {ErrorBoundary} from './components/ErrorBoundary'

const root = document.createElement('div')
document.body.appendChild(root)
render(
  <ErrorBoundary message={'An uncaught exception has occurred. Please contact the Beachfront team for technical support.'}>
    <Provider store={store}>
      <Application />
    </Provider>
  </ErrorBoundary>,
  root,
)
