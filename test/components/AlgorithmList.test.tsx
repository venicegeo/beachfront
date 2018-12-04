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
// import {AlgorithmList} from '../../src/components/AlgorithmList'
// import {Algorithm} from '../../src/components/Algorithm'
//
// describe('<AlgorithmListList/>', () => {
//   let _props
//
//   beforeEach(() => {
//     _props = {
//       algorithms: [{
//         description:  'test-description',
//         id:           'test-id',
//         name:         'test-name',
//         requirements: [],
//         type:         'test-type',
//         url:         'test-url',
//       }],
//       sceneMetadata: {
//         cloudCover: 5,
//       },
//       isSubmitting: false,
//       selectedId: '',
//       onSelect: sinon.stub(),
//       onSubmit: sinon.stub(),
//     }
//   })
//
//   it('renders', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.equal(wrapper.find('.AlgorithmList-root').length, 1)
//     assert.equal(wrapper.find(Algorithm).length, 1)
//   })
//
//   it('can have multiple algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[
//           {
//             description:  'test-description',
//             id:           'test-algorithm-1',
//             maxCloudCover: 30,
//             name:         'test-name',
//             type:         'test-type',
//           },
//           {
//             description:  'test-description',
//             id:           'test-algorithm-2',
//             name:         'test-name',
//             maxCloudCover: 30,
//             type:         'test-type',
//           },
//         ]}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.equal(wrapper.find(Algorithm).length, 2)
//   })
//
//   it('can have zero algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[]}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.equal(wrapper.find(Algorithm).length, 0)
//   })
//
//   it('can have selectable algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//         onSelect={_props.onSelect}
//       />,
//     )
//     assert.isFunction(wrapper.find(Algorithm).prop('onSelect'))
//   })
//
//   it('can have submittable algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.isFunction(wrapper.find(Algorithm).prop('onSubmit'))
//   })
//
//   it('can have neither selectable nor submittable algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//       />,
//     )
//     assert.strictEqual(wrapper.find(Algorithm).prop('onSelect'), undefined)
//     assert.strictEqual(wrapper.find(Algorithm).prop('onSubmit'), undefined)
//   })
//
//   it('can have both selectable AND submittable algorithms', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//         onSelect={_props.onSelect}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     assert.isFunction(wrapper.find(Algorithm).prop('onSelect'))
//     assert.isFunction(wrapper.find(Algorithm).prop('onSubmit'))
//   })
//
//   it('indicates selected algorithm', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[
//           {
//             description:  'test-description',
//             id:           'test-algorithm-1',
//             maxCloudCover: 30,
//             name:         'test-name',
//             type:         'test-type',
//           },
//           {
//             description:  'test-description',
//             id:           'test-algorithm-2',
//             name:         'test-name',
//             maxCloudCover: 30,
//             type:         'test-type',
//           },
//         ]}
//         sceneMetadata={_props.sceneMetadata}
//         selectedId="test-algorithm-2"
//         onSelect={_props.onSelect}
//       />,
//     )
//     assert.isFalse(wrapper.find(Algorithm).at(0).prop('isSelected'))
//     assert.isTrue(wrapper.find(Algorithm).at(1).prop('isSelected'))
//   })
//
//   it('updates selected algorithm when props change', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[
//           {
//             description:  'test-description',
//             id:           'test-algorithm-1',
//             maxCloudCover: 30,
//             name:         'test-name',
//             type:         'test-type',
//           },
//           {
//             description:  'test-description',
//             id:           'test-algorithm-2',
//             name:         'test-name',
//             maxCloudCover: 30,
//             type:         'test-type',
//           },
//         ]}
//         sceneMetadata={_props.sceneMetadata}
//         selectedId="test-algorithm-2"
//         onSelect={_props.onSelect}
//       />,
//     )
//     wrapper.setProps({ selectedId: 'test-algorithm-1' })
//     assert.isTrue(wrapper.find(Algorithm).at(0).prop('isSelected'))
//     assert.isFalse(wrapper.find(Algorithm).at(1).prop('isSelected'))
//   })
//
//   it('bubbles `onSubmit` event', () => {
//     const [algorithm] = _props.algorithms
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[algorithm]}
//         sceneMetadata={_props.sceneMetadata}
//         onSubmit={_props.onSubmit}
//       />,
//     )
//     wrapper.find(Algorithm).props().onSubmit(algorithm)
//     assert.isTrue(_props.onSubmit.calledWithExactly(algorithm))
//   })
//
//   it('bubbles `onSelect` event', () => {
//     const [algorithm] = _props.algorithms
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={[algorithm]}
//         sceneMetadata={_props.sceneMetadata}
//         onSelect={_props.onSelect}
//       />,
//     )
//     wrapper.find(Algorithm).props().onSelect(algorithm)
//     assert.isTrue(_props.onSelect.calledWithExactly(algorithm))
//   })
//
//   it('passes thru warning messages', () => {
//     const wrapper = shallow(
//       <AlgorithmList
//         algorithms={_props.algorithms}
//         sceneMetadata={_props.sceneMetadata}
//         warningHeading="test-warning-heading"
//         warningMessage="test-warning-message"
//       />,
//     )
//     assert.equal(wrapper.find(Algorithm).prop('warningHeading'), 'test-warning-heading')
//     assert.equal(wrapper.find(Algorithm).prop('warningMessage'), 'test-warning-message')
//   })
// })
