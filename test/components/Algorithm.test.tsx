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

import * as React from 'react'
import {shallow} from 'enzyme'
import {assert} from 'chai'
import * as sinon from 'sinon'
import Algorithm from 'app/components/Algorithm'

describe('<Algorithm/>', () => {
  let _props

  beforeEach(() => {
    _props = {
      algorithm: {
        description:  'test-description',
        name:         'test-name',
        requirements: [],
      },
      imageProperties: {
        bands:      {},
        cloudCover: 5,
      },
      isSubmitting: false,
      onSubmit:     sinon.stub(),
    }
  })

  it('renders', () => {
    const wrapper = shallow(
      <Algorithm
        algorithm={_props.algorithm}
        imageProperties={_props.imageProperties}
        isSubmitting={_props.isSubmitting}
        onSubmit={_props.onSubmit}
      />
    )
    assert.equal(wrapper.find('.Algorithm__name').text(), 'test-name')
    assert.equal(wrapper.find('.Algorithm__description').text(), 'test-description')
    assert.equal(wrapper.find('.Algorithm__startButton').length, 1)
  })

  it('prevents new submissions while submission in flight', () => {
    const wrapper = shallow(
      <Algorithm
        algorithm={_props.algorithm}
        imageProperties={_props.imageProperties}
        isSubmitting={true}
        onSubmit={_props.onSubmit}
      />
    )
    assert.isTrue(wrapper.find('.Algorithm__startButton').prop('disabled'))
  })

  // FIXME -- the following cases require a component refactor to do this in a sane way
  it('verifies image compatibility (meets all requirements)')
  it('verifies image compatibility (meets some requirements)')
  it('verifies image compatibility (meets no requirements)')
})