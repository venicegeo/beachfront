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

// import {assert} from 'chai'
// import * as sinon from 'sinon'
// import axios from 'axios'
// import * as service from '../../src/api/session'
//
// describe('Session Service', () => {
//   let globalStubs: GlobalStubs
//
//   beforeEach(() => {
//     globalStubs = {
//       error: sinon.stub(console, 'error'),
//     }
//   })
//
//   afterEach(() => {
//     service.destroy()
//     globalStubs.error.restore()
//   })
//
//   describe('initialize()', () => {
//     const originalEntry = location.pathname + location.search
//
//     afterEach(() => {
//       sessionStorage.clear()
//       history.replaceState(null, null, originalEntry)
//     })
//
//     it('indicates when session exists', () => {
//       sessionStorage.setItem('__timestamp__', '2017-01-12T00:00:00Z')
//       const exists = service.initialize()
//       assert.isTrue(exists)
//     })
//
//     it('indicates when session does not exist', () => {
//       const exists = service.initialize()
//       assert.isFalse(exists)
//     })
//
//     it('records entry URL', () => {
//       history.replaceState(null, null, '/test-pathname?test-search')
//       service.initialize()
//       assert.equal(sessionStorage.getItem('__entry__'), '/test-pathname?test-search')
//     })
//
//     it('records time of login', () => {
//       history.replaceState(null, null, '/?logged_in=true')
//       service.initialize()
//       assert.match(sessionStorage.getItem('__timestamp__'), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
//     })
//
//     it('redirects to entry URL on successful login', () => {
//       sessionStorage.setItem('__entry__', '/correct-pathname?correct-search')
//       history.replaceState(null, null, '/?logged_in=true')
//       service.initialize()
//       assert.equal(location.pathname, '/correct-pathname')
//       assert.equal(location.search, '?correct-search')
//     })
//
//     it('does not redirect if session already exists', () => {
//       sessionStorage.setItem('__timestamp__', '2017-01-12T00:00:00Z')
//       history.replaceState(null, null, '/some/arbitrary/path?jobId=1234')
//       assert.equal(location.pathname, '/some/arbitrary/path')
//       assert.equal(location.search, '?jobId=1234')
//     })
//
//     it('cleans up after successful login', () => {
//       sessionStorage.setItem('__entry__', '/correct-pathname?correct-search')
//       history.replaceState(null, null, '/?logged_in=true')
//       service.initialize()
//       assert.isNull(sessionStorage.getItem('__entry__'))
//     })
//   })
//
//   describe('getClient()', () => {
//     let stub: Sinon.SinonStub
//
//     beforeEach(() => {
//       stub = sinon.stub(axios, 'create')
//     })
//
//     afterEach(() => {
//       sessionStorage.clear()
//       stub.restore()
//     })
//
//     it('creates axios instance', () => {
//       service.getClient()
//       assert.equal(stub.callCount, 1)
//     })
//
//     it('creates axios instance with correct base URL', () => {
//       service.getClient()
//       assert.equal(stub.firstCall.args[0].baseURL, '/test-api-root')
//     })
//
//     it('creates axios instance with sensible timeout', () => {
//       service.getClient()
//       assert.isAbove(stub.firstCall.args[0].timeout, 3000)
//       assert.isBelow(stub.firstCall.args[0].timeout, 30001)
//     })
//
//     it('creates axios instance with correct CSRF header', () => {
//       service.getClient()
//       assert.deepEqual(stub.firstCall.args[0].headers['X-Requested-With'], 'XMLHttpRequest')
//     })
//
//     it('reuses existing client instances', () => {
//       const client = {isTotallyAnAxiosInstance: true}
//       stub.returns(client)
//       assert.strictEqual(service.getClient(), client)
//     })
//
//     it('can handle gratuitous invocations', () => {
//       const client = {isTotallyAnAxiosInstance: true}
//       stub.returns(client)
//       assert.doesNotThrow(() => {
//         for (let i = 0; i < 100; i++) {
//           assert.strictEqual(service.getClient(), client)
//         }
//       })
//     })
//   })
//
//   describe('destroy()', () => {
//     it('actually clears the session', () => {
//       sessionStorage.setItem('lorem', '###########')
//       sessionStorage.setItem('ipsum', '###########')
//       sessionStorage.setItem('dolor', '###########')
//       service.destroy()
//       assert.equal(sessionStorage.length, 0)
//     })
//   })
// })
//
// //
// // Helpers
// //
//
// interface GlobalStubs {
//   error: Sinon.SinonStub
// }
