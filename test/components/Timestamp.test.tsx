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
// import {Timestamp} from '../../src/components/Timestamp'
//
// const MILLISECOND = 1
// const SECOND = 1000 * MILLISECOND
// const MINUTE = 60 * SECOND
// const HOUR = 60 * MINUTE
//
// describe('<Timestamp/>', () => {
//   let _props
//
//   beforeEach(() => {
//     _props = {
//       timestamp: Date.now() - (3 * HOUR),
//     }
//   })
//
//   it('renders', () => {
//     const wrapper = shallow(
//       <Timestamp
//         timestamp={_props.timestamp}
//       />,
//     )
//     assert.equal(wrapper.text(), '3 hours ago')
//   })
//
//   it('accepts ISO8601 timestamp', () => {
//     const wrapper = shallow(
//       <Timestamp
//         timestamp={new Date(Date.now() - (96 * HOUR)).toISOString()}
//       />,
//     )
//     assert.equal(wrapper.text(), '4 days ago')
//   })
//
//   it('can toggle relative and absolute timestamps', () => {
//     const wrapper = shallow(
//       <Timestamp
//         timestamp={'2016-01-15T12:34:00Z'}
//       />,
//     )
//     wrapper.simulate('click', new Event('click'))
//     assert.match(wrapper.text(), /Jan \d{2}, 2016 \d{1,2}:34 (AM|PM)$/)
//   })
// })
