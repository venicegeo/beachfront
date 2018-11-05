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

// import * as React from 'react'
// import {shallow} from 'enzyme'
// import {assert} from 'chai'
// import * as sinon from 'sinon'
// import {Algorithm} from '../../src/components/Algorithm'
//
// describe('<Algorithm/>', () => {
//   let _props
//
//   beforeEach(() => {
//     _props = {
//       algorithm: {
//         description:   'test-description',
//         maxCloudCover: 30,
//         name:          'test-name',
//       },
//       sceneMetadata: {
//         cloudCover: 5,
//       },
//       isSelected:   false,
//       isSubmitting: false,
//       onSelect:     sinon.stub(),
//       onSubmit:     sinon.stub(),
//     }
//   })
//
//   it('renders', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-name').text(), 'test-name')
//     assert.equal(wrapper.find('.Algorithm-description').text(), 'test-description')
//     assert.equal(wrapper.find('.Algorithm-requirements tbody tr th').at(0).text(), 'Maximum Cloud Cover')
//     assert.equal(wrapper.find('.Algorithm-requirements tbody tr td').at(0).text(), 'Less than or equal to 30%')
//   })
//
//   it('can be neither selectable nor submittable', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-selectionIndicator').length, 0)
//     assert.equal(wrapper.find('.Algorithm-startButton').length, 0)
//   })
//
//   it('can be selectable', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         onSelect={_props.onSelect}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-selectionIndicator').length, 1)
//   })
//
//   it('can be submittable', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-startButton').length, 1)
//   })
//
//   it('can be selectable AND submittable', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         onSelect={_props.onSelect}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-selectionIndicator').length, 1)
//     assert.equal(wrapper.find('.Algorithm-startButton').length, 1)
//   })
//
//   it('prevents new submissions while submission in flight', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.isTrue(wrapper.find('.Algorithm-startButton').prop('disabled'))
//   })
//
//   it('shows as `selected` appropriately', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         isSelected={true}
//         onSelect={_props.onSelect}
//       />,
//     )
//     assert.isTrue(wrapper.find('.Algorithm-selectionIndicator input').prop('checked'))
//   })
//
//   it('emits `onSelect` event', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         isSelected={_props.isSelected}
//         onSelect={_props.onSelect}
//       />,
//     )
//     wrapper.find('.Algorithm-header').simulate('click')
//     assert.isTrue(_props.onSelect.called)
//   })
//
//   it('does not emit `onSelect` event if already selected', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         isSelected={true}
//         onSelect={_props.onSelect}
//       />,
//     )
//     wrapper.find('.Algorithm-header').simulate('click')
//     assert.isTrue(_props.onSelect.notCalled)
//   })
//
//   it('does not emit `onSelect` event if not selectable', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     wrapper.find('.Algorithm-header').simulate('click')
//     assert.isTrue(_props.onSelect.notCalled)
//   })
//
//   it('emits `onSubmit` event', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     wrapper.find('.Algorithm-startButton').simulate('click')
//     assert.isTrue(_props.onSubmit.called)
//   })
//
//   it('verifies image compatibility (meets cloud cover requirements)', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={{
//           description:  'test-description',
//           id:           'test-id',
//           maxCloudCover: 10,
//           name:         'test-name',
//           type:         'test-type',
//         }}
//         sceneMetadata={{
//           cloudCover: 5,
//         } as any}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-root').hasClass('Algorithm-isCompatible'), true)
//     assert.equal(wrapper.find('.Algorithm-requirements tbody tr').at(0).hasClass('Algorithm-met'), true)
//   })
//
//   it('verifies image compatibility (does not meet cloud cover requirements)', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={{
//           description:   'test-description',
//           id:            'test-id',
//           maxCloudCover: 9000,
//           name:          'test-name',
//           type:          'test-type',
//         }}
//         sceneMetadata={{
//           cloudCover: 9001,
//         } as any}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-root').hasClass('Algorithm-isNotCompatible'), true)
//     assert.equal(wrapper.find('.Algorithm-requirements tbody tr').at(0).hasClass('Algorithm-unmet'), true)
//   })
//
//   it('supports custom compatibility warnings', () => {
//     const wrapper = shallow(
//       <Algorithm
//         algorithm={_props.algorithm}
//         sceneMetadata={_props.sceneMetadata}
//         warningHeading="test-warning-heading"
//         warningMessage="test-warning-message"
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.equal(wrapper.find('.Algorithm-compatibilityWarning h4').text().trim(), 'test-warning-heading')
//     assert.equal(wrapper.find('.Algorithm-compatibilityWarning p').text().trim(), 'test-warning-message')
//   })
// })
