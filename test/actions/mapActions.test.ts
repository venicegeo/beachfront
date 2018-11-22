/*
 * Copyright 2018, RadiantBlue Technologies, Inc.
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
 */

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import thunk from 'redux-thunk'
import configureStore from 'redux-mock-store'
import {mapActions, types} from '../../src/actions/mapActions'
import {mapInitialState} from '../../src/reducers/mapReducer'
import {MODE_DRAW_BBOX, MODE_NORMAL, MODE_PRODUCT_LINES, MODE_SELECT_IMAGERY} from '../../src/components/PrimaryMap'
import {Extent, Point} from '../../src/utils/geometries'

const mockStore = configureStore([thunk])
let store

const mockAdapter = new MockAdapter(axios)

describe('catalogActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()

    store = mockStore({
      map: mapInitialState,
    })
  })

  afterEach(() => {
    mockAdapter.reset()
  })

  afterAll(() => {
    mockAdapter.restore()
  })

  describe('initialized()', () => {
    test('success', async () => {
      const mockMap = 'a'
      const mockCollections = ['a', 'b', 'c']

      await store.dispatch(mapActions.initialized(mockMap as any, mockCollections))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_INITIALIZED,
          map: mockMap,
          collections: mockCollections,
        },
      ])
    })
  })

  describe('updateMode()', () => {
    test('MODE_NORMAL', async () => {
      store = mockStore({
        route: {
          pathname: 'unhandledPathname',
        },
      })

      await store.dispatch(mapActions.updateMode())

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_MODE_UPDATED,
          mode: MODE_NORMAL,
        },
      ])
    })

    test('MODE_SELECT_IMAGERY', async () => {
      store = mockStore({
        map: {
          ...mapInitialState,
          bbox: [1, 2, 3, 4],
        },
        route: {
          pathname: '/create-job',
        },
        catalog: {
          searchResults: ['a', 'b', 'c'],
        },
      })

      await store.dispatch(mapActions.updateMode())

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_MODE_UPDATED,
          mode: MODE_SELECT_IMAGERY,
        },
      ])
    })

    test('MODE_DRAW_BBOX (via /create-job)', async () => {
      store = mockStore({
        map: {
          ...mapInitialState,
          bbox: null,
        },
        route: {
          pathname: '/create-job',
        },
        catalog: {
          searchResults: null,
        },
      })

      await store.dispatch(mapActions.updateMode())

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_MODE_UPDATED,
          mode: MODE_DRAW_BBOX,
        },
      ])
    })

    test('MODE_DRAW_BBOX (via /create-product-line)', async () => {
      store = mockStore({
        route: {
          pathname: '/create-product-line',
        },
      })

      await store.dispatch(mapActions.updateMode())

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_MODE_UPDATED,
          mode: MODE_DRAW_BBOX,
        },
      ])
    })

    test('MODE_PRODUCT_LINES', async () => {
      store = mockStore({
        route: {
          pathname: '/product-lines',
        },
      })

      await store.dispatch(mapActions.updateMode())

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_MODE_UPDATED,
          mode: MODE_PRODUCT_LINES,
        },
      ])
    })
  })

  describe('updateBbox()', () => {
    test('success', async () => {
      const mockBbox = [1, 2, 3, 4]

      await store.dispatch(mapActions.updateBbox(mockBbox as any))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_BBOX_UPDATED,
          bbox: mockBbox,
        },
      ])
    })
  })

  describe('clearBbox()', () => {
    test('success', async () => {
      await store.dispatch(mapActions.clearBbox())

      expect(store.getActions()).toEqual([
        { type: types.MAP_BBOX_CLEARED },
      ])
    })
  })

  describe('updatedDetections()', () => {
    describe('default case', () => {
      test('success', async () => {
        store = mockStore({
          route: {
            pathname: 'unhandledPathname',
            jobIds: ['a', 'c'],
          },
          jobs: {
            records: [
              { id: 'a' },
              { id: 'b' },
              { id: 'c' },
            ],
          },
          map: {
            detections: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_DETECTIONS_UPDATED,
            detections: [
              { id: 'a' },
              { id: 'c' },
            ],
          },
        ])
      })

      test('detections not changed', async () => {
        const mockJobs = [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
        ]
        store = mockStore({
          route: {
            pathname: 'unhandledPathname',
            jobIds: [mockJobs[0].id, mockJobs[1].id],
          },
          jobs: {
            records: mockJobs,
          },
          map: {
            detections: [
              mockJobs[0],
              mockJobs[1],
            ],
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([])
      })
    })

    describe('case "/create-product-line"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'b' }
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          jobs: {
            records: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
          map: {
            detections: [],
            selectedFeature: mockSelectedFeature,
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_DETECTIONS_UPDATED,
            detections: [
              mockSelectedFeature,
            ],
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLinesRecords = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          map: {
            detections: [],
          },
          productLines: {
            records: mockProductLinesRecords,
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_DETECTIONS_UPDATED,
            detections: mockProductLinesRecords,
          },
        ])
      })
    })

    describe('case "/product-lines"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'b' }
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          jobs: {
            records: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
          map: {
            detections: [],
            selectedFeature: mockSelectedFeature,
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_DETECTIONS_UPDATED,
            detections: [
              mockSelectedFeature,
            ],
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLinesRecords = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          map: {
            detections: [],
          },
          productLines: {
            records: mockProductLinesRecords,
          },
        })

        await store.dispatch(mapActions.updateDetections())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_DETECTIONS_UPDATED,
            detections: mockProductLinesRecords,
          },
        ])
      })
    })
  })

  describe('updateFrames()', () => {
    describe('default case', () => {
      test('success', async () => {
        store = mockStore({
          route: {
            pathname: 'unhandledPathname',
          },
          jobs: {
            records: [
              { id: 'a' },
              { id: 'c' },
            ],
          },
          map: {
            frames: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_FRAMES_UPDATED,
            frames: [
              { id: 'a' },
              { id: 'c' },
            ],
          },
        ])
      })

      test('frames not changed', async () => {
        const mockJobs = [
          { id: 'a' },
          { id: 'b' },
          { id: 'c' },
        ]
        store = mockStore({
          route: {
            pathname: 'unhandledPathname',
          },
          jobs: {
            records: mockJobs,
          },
          map: {
            frames: mockJobs,
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([])
      })
    })

    describe('case "/create-product-line"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'c' }
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          productLines: {
            records: mockProductLines,
          },
          map: {
            frames: [],
            selectedFeature: mockSelectedFeature,
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_FRAMES_UPDATED,
            frames: [
              mockSelectedFeature,
              ...mockProductLines,
            ],
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/create-product-line',
          },
          productLines: {
            records: mockProductLines,
          },
          map: {
            frames: [],
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_FRAMES_UPDATED,
            frames: mockProductLines,
          },
        ])
      })
    })

    describe('case "/product-lines"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'c' }
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/product-lines',
          },
          productLines: {
            records: mockProductLines,
          },
          map: {
            frames: [],
            selectedFeature: mockSelectedFeature,
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_FRAMES_UPDATED,
            frames: [
              mockSelectedFeature,
              ...mockProductLines,
            ],
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          route: {
            pathname: '/product-lines',
          },
          productLines: {
            records: mockProductLines,
          },
          map: {
            frames: [],
          },
        })

        await store.dispatch(mapActions.updateFrames())

        expect(store.getActions()).toEqual([
          {
            type: types.MAP_FRAMES_UPDATED,
            frames: mockProductLines,
          },
        ])
      })
    })
  })

  describe('setSelectedFeature()', () => {
    test('success', async () => {
      store = mockStore({
        map: {
          selectedFeature: null,
        },
      })

      const mockFeature = { id: 'a' }

      await store.dispatch(mapActions.setSelectedFeature(mockFeature as any))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_SELECTED_FEATURE_UPDATED,
          selectedFeature: mockFeature,
        },
      ])
    })

    test('feature already selected', async () => {
      const mockFeature = { id: 'a' }
      store = mockStore({
        map: {
          selectedFeature: mockFeature,
        },
      })

      await store.dispatch(mapActions.setSelectedFeature(mockFeature as any))

      expect(store.getActions()).toEqual([])
    })
  })

  describe('setHoveredFeature()', () => {
    test('success', async () => {
      const mockFeature = { id: 'a' }

      await store.dispatch(mapActions.setHoveredFeature(mockFeature as any))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_HOVERED_FEATURE_UPDATED,
          hoveredFeature: mockFeature,
        },
      ])
    })
  })

  describe('updateView()', () => {
    test('success', async () => {
      const mockView = { some: 'data' }

      await store.dispatch(mapActions.updateView(mockView as any))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_VIEW_UPDATED,
          view: mockView,
        },
      ])
    })
  })

  describe('panToPoint()', () => {
    test('success', async () => {
      const point = [1, 2] as Point
      const zoom = 3

      await store.dispatch(mapActions.panToPoint({
        point,
        zoom,
      }))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_PAN_TO_POINT,
          point,
          zoom,
        },
      ])
    })

    test('default zoom', async () => {
      const point = [1, 2] as Point

      await store.dispatch(mapActions.panToPoint({
        point,
      }))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_PAN_TO_POINT,
          point,
          zoom: 10,
        },
      ])
    })
  })

  describe('panToExtent()', () => {
    test('success', async () => {
      const extent = [1, 2, 3, 4] as Extent

      await store.dispatch(mapActions.panToExtent(extent))

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_PAN_TO_EXTENT,
          extent,
        },
      ])
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      store = mockStore({
        map: {
          view: {
            center: [181, 0],
          },
          bbox: [181, 0, 182, 1],
        },
      })

      await store.dispatch(mapActions.serialize())

      // Note: coordinates should be wrapped within -180/180.
      expect(sessionStorage.setItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('bbox', JSON.stringify([-179, 0, -178, 1]))
      expect(sessionStorage.setItem).toHaveBeenCalledWith('mapView', JSON.stringify({ center: [-179, 0] }))

      expect(store.getActions()).toEqual([
        { type: types.MAP_SERIALIZED },
      ])
    })
  })

  describe('deserialize()', () => {
    test('success', async () => {
      const mockStorage = {
        bbox: [1, 2, 3, 4],
        mapView: {
          center: [1, 2],
        },
      }
      sessionStorage.setItem('bbox', JSON.stringify(mockStorage.bbox))
      sessionStorage.setItem('mapView', JSON.stringify(mockStorage.mapView))

      await store.dispatch(mapActions.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('bbox')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('mapView')

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_DESERIALIZED,
          deserialized: {
            bbox: mockStorage.bbox,
            view: mockStorage.mapView,
          },
        },
      ])
    })

    test('invalid saved data', async () => {
      sessionStorage.setItem('bbox', 'badJson')
      sessionStorage.setItem('mapView', 'badJson')

      await store.dispatch(mapActions.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('bbox')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('mapView')

      expect(store.getActions()).toEqual([
        {
          type: types.MAP_DESERIALIZED,
          deserialized: {},
        },
      ])
    })
  })
})
