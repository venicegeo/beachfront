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

import {assert} from 'chai'
import * as sinon from 'sinon'
import * as session from '../../src/api/session'
import * as geoserver from '../../src/api/geoserver'
import {AxiosPromise} from 'axios'
import {USER_ENDPOINT} from '../../src/config'

describe('GeoServer Service', () => {
  let client: FakeClient

  beforeEach(() => {
    client = {
      get: sinon.stub(),
    }
    sinon.stub(session, 'getClient').returns(client)
    sinon.stub(console, 'debug')
    sinon.stub(console, 'error')
  })

  afterEach(() => {
    sinon.restore(session.getClient)
    sinon.restore(console.debug)
    sinon.restore(console.error)
  })

  describe('discover()', () => {
    it('returns WMS URL', () => {
      client.get.returns(resolve({services: {wms_server: 'test-wms-url'}}))
      return geoserver.lookup()
        .then(descriptor => {
          assert.equal(descriptor.wmsUrl, 'test-wms-url')
        })
    })

    it('calls correct URL', () => {
      client.get.returns(resolve({services: {wms_server: 'test-wms-url'}}))
      return geoserver.lookup()
        .then(() => {
          assert.deepEqual(client.get.firstCall.args, [USER_ENDPOINT])
        })
    })

    it('throws on HTTP error', () => {
      client.get.returns(reject('test-error', {status: 500}))
      return geoserver.lookup()
        .then(
          () => assert.fail('Should have rejected'),
          (err) => {
            assert.instanceOf(err, Error)
            assert.match(err, /test-error/i)
          },
        )
    })
  })
})

//
// Helpers
//

interface FakeClient {
  get: Sinon.SinonStub
}

function resolve(data): AxiosPromise {
  return Promise.resolve({
    data,
  })
}
function reject(err, response = {}): Promise<void> {
  return Promise.reject(Object.assign(new Error(err), {
    response,
  }))
}
