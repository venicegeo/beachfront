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
// import {mount, shallow} from 'enzyme'
// import {assert} from 'chai'
// import * as sinon from 'sinon'
// import {CatalogSearchCriteria} from '../../src/components/CatalogSearchCriteria'
// import {ImagerySearch} from '../../src/components/ImagerySearch'
//
// describe('<ImagerySearch/>', () => {
//   let _props
//
//   beforeEach(() => {
//     _props = {
//       bbox:               [0, 0, 0, 0],
//       catalogApiKey:      'test-catalog-api-key',
//       cloudCover:         19,
//       dateFrom:           '2016-01-01',
//       dateTo:             '2016-02-01',
//       isSearching:        false,
//       source:             'rapideye',
//       onApiKeyChange:     sinon.stub(),
//       onClearBbox:        sinon.stub(),
//       onCloudCoverChange: sinon.stub(),
//       onDateChange:       sinon.stub(),
//       onSearchCriteriaChange: sinon.stub(),
//       onSubmit:           sinon.stub(),
//       onSourceChange:     sinon.stub(),
//     }
//   })
//
//   it('renders', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     assert.equal(wrapper.find(CatalogSearchCriteria).length, 1)
//     assert.equal(wrapper.find('button[type="submit"]').length, 1)
//   })
//
//   it('bubbles api key change event', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onApiKeyChange('test-new-catalog-api-key')
//     assert.isTrue(_props.onApiKeyChange.calledWithExactly('test-new-catalog-api-key'))
//   })
//
//   it('bubbles bbox clear event', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onClearBbox()
//     assert.equal(_props.onClearBbox.callCount, 1)
//   })
//
//   it('bubbles cloud cover change event', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onCloudCoverChange(42)
//     assert.isTrue(_props.onCloudCoverChange.calledWithExactly(42))
//   })
//
//   it('bubbles date change event (via "from" date)', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onDateChange('1999-12-31', _props.dateTo)
//     assert.isTrue(_props.onDateChange.calledWithExactly('1999-12-31', _props.dateTo))
//   })
//
//   it('bubbles date change event (via "to" date)', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onDateChange(_props.dateFrom, '1999-12-31')
//     assert.isTrue(_props.onDateChange.calledWithExactly(_props.dateFrom, '1999-12-31'))
//   })
//
//   it('bubbles source change event', () => {
//     const wrapper = shallow(
//         <ImagerySearch
//             bbox={_props.bbox}
//             catalogApiKey={_props.catalogApiKey}
//             cloudCover={_props.cloudCover}
//             dateFrom={_props.dateFrom}
//             dateTo={_props.dateTo}
//             isSearching={_props.isSearching}
//             source={_props.source}
//             onApiKeyChange={_props.onApiKeyChange}
//             onClearBbox={_props.onClearBbox}
//             onCloudCoverChange={_props.onCloudCoverChange}
//             onDateChange={_props.onDateChange}
//             onSearchCriteriaChange={_props.onSearchCriteriaChange}
//             onSubmit={_props.onSubmit}
//             onSourceChange={_props.onSourceChange}
//         />,
//     )
//     wrapper.find(CatalogSearchCriteria).props().onSourceChange('averagespeedeye')
//     assert.isTrue(_props.onSourceChange.calledWithExactly('averagespeedeye'))
//   })
//
//   it('emits submission event', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     const noop = () => {}
//     wrapper.find('form').simulate('submit', { preventDefault: noop, stopPropagation: noop })
//     assert.equal(_props.onSubmit.callCount, 1)
//   })
//
//   it('shows error message if exists', () => {
//     const wrapper = mount(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         error={{
//           message: 'oh noes',
//           stack: 'paper',
//           code: 123,
//         }}
//         isSearching={_props.isSearching}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     assert.equal(wrapper.find('.ImagerySearch-errorMessage').length, 1)
//   })
//
//   it('shows loading indicator while search is in flight', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={true}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     assert.equal(wrapper.find('.ImagerySearch-loadingMask').length, 1)
//   })
//
//   it('prevents button hammering while search is in flight', () => {
//     const wrapper = shallow(
//       <ImagerySearch
//         bbox={_props.bbox}
//         catalogApiKey={_props.catalogApiKey}
//         cloudCover={_props.cloudCover}
//         dateFrom={_props.dateFrom}
//         dateTo={_props.dateTo}
//         isSearching={true}
//         source={_props.source}
//         onApiKeyChange={_props.onApiKeyChange}
//         onClearBbox={_props.onClearBbox}
//         onCloudCoverChange={_props.onCloudCoverChange}
//         onDateChange={_props.onDateChange}
//         onSearchCriteriaChange={_props.onSearchCriteriaChange}
//         onSubmit={_props.onSubmit}
//         onSourceChange={_props.onSourceChange}
//       />,
//     )
//     assert.isTrue(wrapper.find('button[type="submit"]').prop('disabled'))
//   })
// })
