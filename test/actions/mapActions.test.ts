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
import configureStore, {MockStoreEnhanced} from 'redux-mock-store'
import {Map, MapActions} from '../../src/actions/mapActions'
import {mapInitialState} from '../../src/reducers/mapReducer'
import {MODE_DRAW_BBOX, MODE_NORMAL, MODE_PRODUCT_LINES, MODE_SELECT_IMAGERY} from '../../src/components/PrimaryMap'
import {Extent, Point} from '../../src/utils/geometries'
import {routeInitialState} from '../../src/reducers/routeReducer'
import {catalogInitialState} from '../../src/reducers/catalogReducer'
import {jobsInitialState} from '../../src/reducers/jobsReducer'
import {productLinesInitialState} from '../../src/reducers/productLinesReducer'
import {AppState, initialState} from '../../src/store'

const mockStore = configureStore([thunk])
let store: MockStoreEnhanced<AppState>

const mockAdapter = new MockAdapter(axios)

describe('catalogActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    store = mockStore(initialState) as any
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

      await store.dispatch(Map.initialized(mockMap as any, mockCollections as any))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.Initialized.type,
          payload: {
            map: mockMap,
            collections: mockCollections,
          },
        },
      ])
    })
  })

  describe('updateMode()', () => {
    test('MODE_NORMAL', async () => {
      store = mockStore({
        ...initialState,
        route: {
          ...routeInitialState,
          pathname: 'unhandledPathname',
        },
      }) as any

      await store.dispatch(Map.updateMode() as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ModeUpdated.type,
          payload: {
            mode: MODE_NORMAL,
          },
        },
      ])
    })

    test('MODE_SELECT_IMAGERY', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          bbox: [1, 2, 3, 4],
        },
        route: {
          ...routeInitialState,
          pathname: '/create-job',
        },
        catalog: {
          ...catalogInitialState,
          searchResults: ['a', 'b', 'c'],
        },
      }) as any

      await store.dispatch(Map.updateMode() as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ModeUpdated.type,
          payload: {
            mode: MODE_SELECT_IMAGERY,
          },
        },
      ])
    })

    test('MODE_DRAW_BBOX (via /create-job)', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          bbox: null,
        },
        route: {
          ...routeInitialState,
          pathname: '/create-job',
        },
        catalog: {
          ...catalogInitialState,
          searchResults: null,
        },
      }) as any

      await store.dispatch(Map.updateMode() as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ModeUpdated.type,
          payload: {
            mode: MODE_DRAW_BBOX,
          },
        },
      ])
    })

    test('MODE_DRAW_BBOX (via /create-product-line)', async () => {
      store = mockStore({
        ...initialState,
        route: {
          ...routeInitialState,
          pathname: '/create-product-line',
        },
      }) as any

      await store.dispatch(Map.updateMode() as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ModeUpdated.type,
          payload: {
            mode: MODE_DRAW_BBOX,
          },
        },
      ])
    })

    test('MODE_PRODUCT_LINES', async () => {
      store = mockStore({
        ...initialState,
        route: {
          ...routeInitialState,
          pathname: '/product-lines',
        },
      }) as any

      await store.dispatch(Map.updateMode() as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ModeUpdated.type,
          payload: {
            mode: MODE_PRODUCT_LINES,
          },
        },
      ])
    })
  })

  describe('updateBbox()', () => {
    test('success', async () => {
      const mockBbox = [1, 2, 3, 4]

      await store.dispatch(Map.updateBbox(mockBbox as any))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.BboxUpdated.type,
          payload: {
            bbox: mockBbox,
          },
        },
      ])
    })
  })

  describe('clearBbox()', () => {
    test('success', async () => {
      await store.dispatch(Map.clearBbox())

      expect(store.getActions()).toEqual([
        { type: MapActions.BboxCleared.type },
      ])
    })
  })

  describe('updatedDetections()', () => {
    describe('default case', () => {
      test('success', async () => {
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: 'unhandledPathname',
            jobIds: ['a', 'c'],
          },
          jobs: {
            ...jobsInitialState,
            records: [
              { id: 'a' },
              { id: 'b' },
              { id: 'c' },
            ],
          },
          map: {
            ...mapInitialState,
            detections: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.DetectionsUpdated.type,
            payload: {
              detections: [
                { id: 'a' },
                { id: 'c' },
              ],
            },
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
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: 'unhandledPathname',
            jobIds: [mockJobs[0].id, mockJobs[1].id],
          },
          jobs: {
            ...jobsInitialState,
            records: mockJobs,
          },
          map: {
            ...mapInitialState,
            detections: [
              mockJobs[0],
              mockJobs[1],
            ],
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([])
      })
    })

    describe('case "/create-product-line"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'b' }
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          jobs: {
            ...jobsInitialState,
            records: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
          map: {
            ...mapInitialState,
            detections: [],
            selectedFeature: mockSelectedFeature,
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.DetectionsUpdated.type,
            payload: {
              detections: [
                mockSelectedFeature,
              ],
            },
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLinesRecords = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          map: {
            ...mapInitialState,
            detections: [],
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLinesRecords,
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.DetectionsUpdated.type,
            payload: {
              detections: mockProductLinesRecords,
            },
          },
        ])
      })
    })

    describe('case "/product-lines"', () => {
      test('success (with selected feature)', async () => {
        const mockSelectedFeature = { id: 'b' }
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          jobs: {
            ...jobsInitialState,
            records: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
          map: {
            ...mapInitialState,
            detections: [],
            selectedFeature: mockSelectedFeature,
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.DetectionsUpdated.type,
            payload: {
              detections: [
                mockSelectedFeature,
              ],
            },
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLinesRecords = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          map: {
            ...mapInitialState,
            detections: [],
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLinesRecords,
          },
        }) as any

        await store.dispatch(Map.updateDetections() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.DetectionsUpdated.type,
            payload: {
              detections: mockProductLinesRecords,
            },
          },
        ])
      })
    })
  })

  describe('updateFrames()', () => {
    describe('default case', () => {
      test('success', async () => {
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: 'unhandledPathname',
          },
          jobs: {
            ...jobsInitialState,
            records: [
              { id: 'a' },
              { id: 'c' },
            ],
          },
          map: {
            ...mapInitialState,
            frames: [
              { id: 'a' },
              { id: 'b' },
            ],
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.FramesUpdated.type,
            payload: {
              frames: [
                { id: 'a' },
                { id: 'c' },
              ],
            },
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
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: 'unhandledPathname',
          },
          jobs: {
            ...jobsInitialState,
            records: mockJobs,
          },
          map: {
            ...mapInitialState,
            frames: mockJobs,
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

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
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLines,
          },
          map: {
            ...mapInitialState,
            frames: [],
            selectedFeature: mockSelectedFeature,
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.FramesUpdated.type,
            payload: {
              frames: [
                mockSelectedFeature,
                ...mockProductLines,
              ],
            },
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/create-product-line',
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLines,
          },
          map: {
            ...mapInitialState,
            frames: [],
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.FramesUpdated.type,
            payload: {
              frames: mockProductLines,
            },
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
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/product-lines',
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLines,
          },
          map: {
            ...mapInitialState,
            frames: [],
            selectedFeature: mockSelectedFeature,
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.FramesUpdated.type,
            payload: {
              frames: [
                mockSelectedFeature,
                ...mockProductLines,
              ],
            },
          },
        ])
      })

      test('success (without selected feature)', async () => {
        const mockProductLines = [
          { id: 'a' },
          { id: 'b' },
        ]
        store = mockStore({
          ...initialState,
          route: {
            ...routeInitialState,
            pathname: '/product-lines',
          },
          productLines: {
            ...productLinesInitialState,
            records: mockProductLines,
          },
          map: {
            ...mapInitialState,
            frames: [],
          },
        }) as any

        await store.dispatch(Map.updateFrames() as any)

        expect(store.getActions()).toEqual([
          {
            type: MapActions.FramesUpdated.type,
            payload: {
              frames: mockProductLines,
            },
          },
        ])
      })
    })
  })

  describe('setSelectedFeature()', () => {
    test('success', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          selectedFeature: null,
        },
      }) as any

      const mockFeature = { id: 'a' }

      await store.dispatch(Map.setSelectedFeature(mockFeature as any) as any)

      expect(store.getActions()).toEqual([
        {
          type: MapActions.SelectedFeatureUpdated.type,
          payload: {
            selectedFeature: mockFeature,
          },
        },
      ])
    })

    test('feature already selected', async () => {
      const mockFeature = { id: 'a' }
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          selectedFeature: mockFeature,
        },
      }) as any

      await store.dispatch(Map.setSelectedFeature(mockFeature as any) as any)

      expect(store.getActions()).toEqual([])
    })
  })

  describe('setHoveredFeature()', () => {
    test('success', async () => {
      const mockFeature = { id: 'a' }

      await store.dispatch(Map.setHoveredFeature(mockFeature as any))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.HoveredFeatureUpdated.type,
          payload: {
            hoveredFeature: mockFeature,
          },
        },
      ])
    })
  })

  describe('updateView()', () => {
    test('success', async () => {
      const mockView = { some: 'data' }

      await store.dispatch(Map.updateView(mockView as any))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.ViewUpdated.type,
          payload: {
            view: mockView,
          },
        },
      ])
    })
  })

  describe('panToPoint()', () => {
    test('success', async () => {
      const point = [1, 2] as Point
      const zoom = 3

      await store.dispatch(Map.panToPoint({
        point,
        zoom,
      }))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.PanToPoint.type,
          payload: {
            point,
            zoom,
          },
        },
      ])
    })

    test('default zoom', async () => {
      const point = [1, 2] as Point

      await store.dispatch(Map.panToPoint({
        point,
      }))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.PanToPoint.type,
          payload: {
            point,
            zoom: 10,
          },
        },
      ])
    })
  })

  describe('panToExtent()', () => {
    test('success', async () => {
      const extent = [1, 2, 3, 4] as Extent

      await store.dispatch(Map.panToExtent(extent))

      expect(store.getActions()).toEqual([
        {
          type: MapActions.PanToExtent.type,
          payload: {
            extent,
          },
        },
      ])
    })
  })

  describe('serialize()', () => {
    test('success', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          view: {
            center: [181, 0],
          },
          bbox: [181, 0, 182, 1],
        },
      }) as any

      await store.dispatch(Map.serialize() as any)

      // Note: coordinates should be wrapped within -180/180.
      expect(sessionStorage.setItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.setItem).toHaveBeenCalledWith('bbox', JSON.stringify([-179, 0, -178, 1]))
      expect(sessionStorage.setItem).toHaveBeenCalledWith('mapView', JSON.stringify({ center: [-179, 0] }))

      expect(store.getActions()).toEqual([
        { type: MapActions.Serialized.type },
      ])
    })

    test('handle missing "view" gracefully', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          bbox: [181, 0, 182, 1],
        },
      }) as any

      await store.dispatch(Map.serialize() as any)

      expect(sessionStorage.setItem).toHaveBeenCalledWith('mapView', JSON.stringify(null))

      expect(store.getActions()).toEqual([
        { type: MapActions.Serialized.type },
      ])
    })

    test('handle missing "view.center" gracefully', async () => {
      const mockView = {
        extent: [1, 2, 3, 4],
      }
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          view: mockView,
          bbox: [181, 0, 182, 1],
        },
      }) as any

      await store.dispatch(Map.serialize() as any)

      expect(sessionStorage.setItem).toHaveBeenCalledWith('mapView', JSON.stringify(mockView))

      expect(store.getActions()).toEqual([
        { type: MapActions.Serialized.type },
      ])
    })

    test('handle missing "bbox" gracefully', async () => {
      store = mockStore({
        ...initialState,
        map: {
          ...mapInitialState,
          view: {
            center: [181, 0],
          },
        },
      }) as any

      await store.dispatch(Map.serialize() as any)

      expect(sessionStorage.setItem).toHaveBeenCalledWith('bbox', JSON.stringify(null))

      expect(store.getActions()).toEqual([
        { type: MapActions.Serialized.type },
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

      await store.dispatch(Map.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('bbox')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('mapView')

      expect(store.getActions()).toEqual([
        {
          type: MapActions.Deserialized.type,
          payload: {
            bbox: mockStorage.bbox,
            view: mockStorage.mapView,
          },
        },
      ])
    })

    test('no saved data', async () => {
      await store.dispatch(Map.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('bbox')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('mapView')

      expect(store.getActions()).toEqual([
        {
          type: MapActions.Deserialized.type,
          payload: {
            bbox: null,
            view: null,
          },
        },
      ])
    })

    test('invalid saved data', async () => {
      sessionStorage.setItem('bbox', 'badJson')
      sessionStorage.setItem('mapView', 'badJson')

      await store.dispatch(Map.deserialize())

      expect(sessionStorage.getItem).toHaveBeenCalledTimes(2)
      expect(sessionStorage.getItem).toHaveBeenCalledWith('bbox')
      expect(sessionStorage.getItem).toHaveBeenCalledWith('mapView')

      expect(store.getActions()).toEqual([
        {
          type: MapActions.Deserialized.type,
          payload: {
            bbox: mapInitialState.bbox,
            view: mapInitialState.view,
          },
        },
      ])
    })
  })
})
