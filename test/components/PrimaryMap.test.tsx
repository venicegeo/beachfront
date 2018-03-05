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
import proj from 'ol/proj'
import Map from 'ol/map'
import Polygon from 'ol/geom/polygon'
import Tile from 'ol/layer/tile'
import VectorLayer from 'ol/layer/vector'
import Base from 'ol/layer/base'
import TileWMS from 'ol/source/tilewms'

import {mount} from 'enzyme'
import {assert} from 'chai'
import * as sinon from 'sinon'
import {
  PrimaryMap,
  MODE_NORMAL,
} from '../../src/components/PrimaryMap'

interface Internals {
  detectionsLayers: {[key: string]: Tile}
  drawLayer: VectorLayer
  map: Map
  previewLayers: {[key: string]: Tile}
}

describe('<PrimaryMap/>', () => {
  let _props

  beforeEach(() => {
    _props = {
      bbox:                null,
      catalogApiKey:       '',
      detections:          [],
      frames:              [],
      highlightedFeature:  null,
      imagery:             null,
      isSearching:         false,
      logout:              sinon.stub(),
      mode:                MODE_NORMAL,
      selectedFeature:     null,
      shrunk:              false,
      wmsUrl:              'http://test-geoserver-url',
      onBoundingBoxChange: sinon.stub(),
      omMapInitialization: sinon.stub(),
      onSearchPageChange:  sinon.stub(),
      onSelectFeature:     sinon.stub(),
      onViewChange:        sinon.stub(),
    }
  })

  it('renders', () => {
    const wrapper = mount(
      <PrimaryMap
        bbox={_props.bbox}
        catalogApiKey={_props.catalogApiKey}
        detections={_props.detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={_props.selectedFeature}
        shrunk={_props.shrunk}
        view={_props.view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )
    assert.equal(wrapper.find('.PrimaryMap-root').length, 1)
    assert.equal(wrapper.find('.PrimaryMap-basemapSelect').length, 1)
  })

  it('creates a map instance', () => {
    const wrapper = mount(
      <PrimaryMap
        bbox={_props.bbox}
        catalogApiKey={_props.catalogApiKey}
        detections={_props.detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={_props.selectedFeature}
        shrunk={_props.shrunk}
        view={_props.view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )
    assert.instanceOf((wrapper.instance() as any as Internals).map, Map)
    assert.instanceOf((wrapper.ref('container') as any).node.querySelector('canvas'), HTMLCanvasElement)
  })

  describe('view', () => {
    const getComponent = (view) => mount(
      <PrimaryMap
        bbox={_props.bbox}
        catalogApiKey={_props.catalogApiKey}
        detections={_props.detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={_props.selectedFeature}
        shrunk={_props.shrunk}
        view={view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )

    /*
     * Some tests now require additional time to run due to adding animation to
     * openlayers view transitions.  This in turn requires us to exceed the
     * default Mocha 2000ms timeout for a test.  To do that we need to execute
     * this.timeout(), which is not possible in an arrow function.
     */

    it('has correct center on init', function() {
      this.timeout(3000)
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      return awaitMap(() => {
        const view = (wrapper.instance() as any as Internals).map.getView()
        assert.deepEqual(proj.toLonLat(view.getCenter()), [0, 0])
      }, 2150)
    })

    it('has correct zoom on init', function() {
      this.timeout(3000)
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      return awaitMap(() => {
        const view = (wrapper.instance() as any as Internals).map.getView()
        assert.equal(view.getZoom(), 5.5)
      }, 2150)
    })

    it('has correct basemap on init', () => {
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      return awaitMap(() => {
        assert.equal(wrapper.state('basemapIndex'), 0)
      })
    })

    it('recenters map when `view` prop changes', function() {
      this.timeout(3000)
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      wrapper.setProps({ view: { basemapIndex: 0, center: [30, 30], zoom: 5.5 } })
      return awaitMap(() => {
        const view = (wrapper.instance() as any as Internals).map.getView()
        assert.deepEqual(proj.toLonLat(view.getCenter()).map(Math.round), [30, 30])
      }, 2150)
    })

    it('changes zoom when `view` prop changes', function() {
      this.timeout(3000)
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      wrapper.setProps({ view: { basemapIndex: 0, center: [0, 0], zoom: 10.5 } })
      return awaitMap(() => {
        const view = (wrapper.instance() as any as Internals).map.getView()
        assert.equal(view.getZoom(), 10.5)
      }, 2150)
    })

    it('changes basemap when `view` prop changes', () => {
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      wrapper.setProps({ view: { basemapIndex: 2, center: [0, 0], zoom: 5.5 } })
      return awaitMap(() => {
        assert.equal(wrapper.state('basemapIndex'), 2)
      })
    })

    it('doesnt reverberate `onViewChange` events', () => {
      const wrapper = getComponent({ basemapIndex: 0, center: [0, 0], zoom: 5.5 })
      wrapper.setProps({ view: { basemapIndex: 2, center: [30, 30], zoom: 10.5 } })
      return awaitMap(() => {
        assert.isFalse(wrapper.prop('onViewChange').called)
      }, 300)  // Wait for debounce to complete
    })
  })

  describe('bbox', () => {
    const getComponent = (bbox) => mount(
      <PrimaryMap
        bbox={bbox}
        catalogApiKey={_props.catalogApiKey}
        detections={_props.detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={_props.selectedFeature}
        shrunk={_props.shrunk}
        view={_props.view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )

    it('can render bbox', () => {
      const wrapper = getComponent([0, 0, 30, 30])
      return awaitMap(() => {
        const layerSource = (wrapper.instance() as any as Internals).drawLayer.getSource()
        const features = layerSource.getFeatures()
        const points = (features[0].getGeometry() as Polygon).getCoordinates()[0].map(p => proj.toLonLat(p).map(Math.round))
        assert.equal(features.length, 1)
        assert.deepEqual(points, [[0, 0], [0, 30], [30, 30], [30, 0], [0, 0]])
      })
    })

    it('redraws bbox when `bbox` prop changes', () => {
      const wrapper = getComponent([0, 0, 30, 30])
      wrapper.setProps({ bbox: [-30, -30, 0, 0] })
      return awaitMap(() => {
        const layerSource = (wrapper.instance() as any as Internals).drawLayer.getSource()
        const features = layerSource.getFeatures()
        const points = (features[0].getGeometry() as Polygon).getCoordinates()[0].map(p => proj.toLonLat(p).map(Math.round))
        assert.equal(features.length, 1)
        assert.deepEqual(points, [[-30, -30], [-30, 0], [0, 0], [0, -30], [-30, -30]])
      })
    })

    it('doesnt reverberate `onBoundingBoxChange` event', () => {
      const wrapper = getComponent([0, 0, 30, 30])
      wrapper.setProps({ bbox: [-30, -30, 0, 0] })
      return awaitMap(() => {
        assert.isTrue(wrapper.prop('onBoundingBoxChange').notCalled)
      })
    })
  })

  describe('catalogApiKey', () => {
    const getComponent = (catalogApiKey) => mount(
      <PrimaryMap
        bbox={_props.bbox}
        catalogApiKey={catalogApiKey}
        detections={_props.detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={generateScene()}
        shrunk={_props.shrunk}
        view={_props.view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )

    it('sends correct catalog API key via XYZ', () => {
      const wrapper = getComponent('test-catalog-api-key')
      const sceneId = wrapper.prop('selectedFeature').id
      const urls = ((wrapper.instance() as any as Internals).previewLayers[sceneId].getSource() as TileWMS).getUrls()
      assert.isTrue(urls.every(s => s.includes('test-catalog-api-key')))
    })
  })

  describe('detections', () => {
    const getComponent = (detections) => mount(
      <PrimaryMap
        bbox={_props.bbox}
        catalogApiKey={_props.catalogApiKey}
        detections={detections}
        frames={_props.frames}
        highlightedFeature={_props.highlightedFeature}
        imagery={_props.imagery}
        isSearching={_props.isSearching}
        logout={_props.logout}
        mode={_props.mode}
        selectedFeature={generateScene()}
        shrunk={_props.shrunk}
        view={_props.view}
        wmsUrl={_props.wmsUrl}
        onBoundingBoxChange={_props.onBoundingBoxChange}
        onMapInitialization={_props.onMapInitialization}
        onSearchPageChange={_props.onSearchPageChange}
        onSelectFeature={_props.onSelectFeature}
        onViewChange={_props.onViewChange}
      />,
    )

    it('adds detections layer to map', () => {
      const wrapper = getComponent([generateCompletedJob()])
      const layer = (wrapper.instance() as any as Internals).detectionsLayers['test-job-id']
      assert.include(getLayers(wrapper), layer)
    })

    it('creates one layer per detection', () => {
      const wrapper = getComponent([
        generateCompletedJob('job-1'),
        generateCompletedJob('job-2'),
        generateCompletedJob('job-3'),
      ])
      const layer1 = (wrapper.instance() as any as Internals).detectionsLayers['job-1']
      const layer2 = (wrapper.instance() as any as Internals).detectionsLayers['job-2']
      const layer3 = (wrapper.instance() as any as Internals).detectionsLayers['job-3']
      assert.includeMembers(getLayers(wrapper), [layer1, layer2, layer3])
    })

    it('sends correct layer ID to WMS server', () => {
      const wrapper = getComponent([generateCompletedJob()])
      const source = (wrapper.instance() as any as Internals).detectionsLayers['test-job-id'].getSource() as TileWMS
      assert.equal((source.getParams() as any).LAYERS, 'bfdetections')
    })

    it('sends correct style ID to WMS server', () => {
      const wrapper = getComponent([generateCompletedJob()])
      const source = (wrapper.instance() as any as Internals).detectionsLayers['test-job-id'].getSource() as TileWMS
      assert.equal((source.getParams() as any).STYLES, 'bfdetections')
    })

    it('sends correct view parameters to WMS server', () => {
      const wrapper = getComponent([generateCompletedJob()])
      const source = (wrapper.instance() as any as Internals).detectionsLayers['test-job-id'].getSource() as TileWMS
      assert.deepEqual((source.getParams() as any).VIEWPARAMS, 'jobid:test-job-id')
    })

    it('set appropriate bbox for layer', () => {
      const wrapper = getComponent([generateCompletedJob()])
      const layer = (wrapper.instance() as any as Internals).detectionsLayers['test-job-id']
      assert.deepEqual(layerExtent(layer), [114, -31, 117, -29])
    })
  })

  describe('frames', () => {
    it('renders job frames')
    it('renders bounding box')
    it('renders product line frames')
  })

  describe('wmsUrl', () => {
    it('uses correct geoserver URL')
    it('talks to geoserver via WMS')
  })

  describe('highlightedFeature', () => {
    it('recenters map when anchor prop changes')
    it('doesnt reverberate `onHoverFeature` event')
  })

  describe('imagery', () => {
    it('renders imagery search result footprints')
  })

  describe('mode', () => {
    it('activates correct interactions when mode changes from X to Y')
    it('clears imagery when mode changes')
    it('clears jobs when mode changes')
    it('clears product lines when mode changes')
  })

  describe('selectedFeature', () => {
    it('recenters map when anchor prop changes')
    it('renders preview layer')
    it('can select frame')
    it('can select scene footprint')
    it('doesnt reverberate `onSelectImage` event')
    it('doesnt reverberate `onSelectJob` event')
  })

  describe('eventing', () => {
    it('emits `onAnchorChange` event')
    it('emits `onBoundingBoxChange` event')
    it('emits `onSelectImage` event')
    it('emits `onSelectJob` event')
    it('emits `onSearchPageChange` event')
  })

  describe('UX affordances', () => {
    it('show loading indicator while detections layer (WMS) is loading')
    it('show loading indicator while scene preview layer (XYZ) is loading')
    it('show error message if detections layer (WMS) fails to load')
    it('show error message if scene preview layer (XYZ) fails to load')
  })
})

//
// Helpers
//

/**
 * Gives OpenLayers enough time to complete its composition cycle after some
 * change or event.
 *
 * @param func {Function}
 * @param delay {number}
 */
function awaitMap(func, delay = 150) {
  return new Promise(resolve => setTimeout(resolve, delay)).then(func)
}

function layerExtent(layer) {
  return proj.transformExtent(layer.getExtent(), 'EPSG:3857', 'EPSG:4326').map(Math.round)
}

function generateCompletedJob(jobId?: string) {
  const job = generateRunningJob(jobId)
  job.properties.status = 'Success'
  return job
}

function generateRunningJob(id = 'test-job-id'): beachfront.Job {
  /* tslint:disable */
  return {
    "id": id,
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            114.746519005239,
            -29.256280009726098
          ],
          [
            116.637980889281,
            -29.6294833859327
          ],
          [
            116.201612155345,
            -31.35656771612142
          ],
          [
            114.276617762313,
            -30.9749163181228
          ],
          [
            114.746519005239,
            -29.256280009726098
          ]
        ]
      ]
    },
    "properties": {
      "algorithm_name": "NDWI",
      "created_on": "2016-08-19T22:41:27.713Z",
      "captured_on": "2016-07-01T02:11:05.604Z",
      "scene_id": "planetscope:test-scene-id",
      "scene_sensor_name": "test-scene-sensor-name",
      "name": "BF_19AUG2016",
      "status": "Running",
      "type": "JOB",
    },
    "type": "Feature"
  }
  /* tslint:enable */
}

function generateScene(): beachfront.Scene {
  /* tslint:disable */
  return {
    "type": "Feature",
    "geometry": {
      "type": "Polygon",
      "coordinates": [
        [
          [
            115.245420231654,
            6.82770182318587
          ],
          [
            116.88789826004,
            6.47835671722537
          ],
          [
            116.512213662367,
            4.73558145738235
          ],
          [
            114.875734640415,
            5.09022386615981
          ],
          [
            115.245420231654,
            6.82770182318587
          ]
        ]
      ]
    },
    "properties": {
      "acquiredDate": "2016-07-04T02:32:03.014451+00:00",
      "cloudCover": 11.11,
      "resolution": 30,
      "sensorName": "test-scene-sensor-name",
      "type": "SCENE",
    },
    "id": "planetscope:test-scene-id",
    "bbox": [
      114.875734640415,
      4.73558145738235,
      116.88789826004,
      6.82770182318587
    ]
  }
  /* tslint:enable */
}

function getLayers(wrapper): Base[] {
  return (wrapper.instance() as any as Internals).map.getLayers().getArray()
}
