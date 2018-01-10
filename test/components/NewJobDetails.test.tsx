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
import {mount} from 'enzyme'
import {assert} from 'chai'
import * as sinon from 'sinon'
import {NewJobDetails} from '../../src/components/NewJobDetails'

describe('<NewJobDetails/>', () => {
  let _props

  beforeEach(() => {
    _props = {
      computeMask: true,
      name: 'test-name',
      onComputeMaskChange: sinon.stub(),
      onNameChange: sinon.stub(),
    }
  })

  it('renders', () => {
    const wrapper = mount(
      <NewJobDetails
        computeMask={_props.computeMask}
        name={_props.name}
        onComputeMaskChange={_props.onComputeMaskChange}
        onNameChange={_props.onNameChange}
      />
    )
    assert.equal(wrapper.find('input').not('[type="checkbox"]').prop('value'), 'test-name')
    assert.isTrue(wrapper.find('input[type="checkbox"]').prop('checked'))
  })

  it('emits change event', () => {
    const wrapper = mount(
      <NewJobDetails
        computeMask={_props.computeMask}
        name={_props.name}
        onComputeMaskChange={_props.onComputeMaskChange}
        onNameChange={_props.onNameChange}
      />,
    )
    const input: any = wrapper.find('input').not('[type="checkbox"]')
    input.node.value = 'test-new-value'
    input.simulate('change')
    assert.isTrue(_props.onNameChange.calledWithExactly('test-new-value'))
  })

  it('updates name when props change', () => {
    const wrapper = mount(
      <NewJobDetails
        computeMask={_props.computeMask}
        name={_props.name}
        onComputeMaskChange={_props.onComputeMaskChange}
        onNameChange={_props.onNameChange}
      />,
    )
    wrapper.setProps({name: 'test-new-value'})
    assert.equal(wrapper.find('input').not('[type="checkbox"]').prop('value'), 'test-new-value')
    assert.isTrue(wrapper.find('input[type="checkbox"]').prop('checked'))
  })

  it('updates compute mask when props change', () => {
    const wrapper = mount(
      <NewJobDetails
        computeMask={_props.computeMask}
        name={_props.name}
        onComputeMaskChange={_props.onComputeMaskChange}
        onNameChange={_props.onNameChange}
      />,
    )
    wrapper.setProps({computeMask: false})
    assert.equal(wrapper.find('input').not('[type="checkbox"]').prop('value'), 'test-name')
    assert.isFalse(wrapper.find('input[type="checkbox"]').prop('checked'))
  })
})
