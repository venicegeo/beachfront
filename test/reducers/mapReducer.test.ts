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

import {mapInitialState, mapReducer} from '../../src/reducers/mapReducer'
import {mapTypes} from '../../src/actions/mapActions'
import {TYPE_JOB} from '../../src/constants'

describe('mapReducer', () => {
  test('initialState', () => {
    expect(mapReducer(undefined, {})).toEqual(mapInitialState)
  })

  test('MAP_INITIALIZED', () => {
    const action = {
      type: mapTypes.MAP_INITIALIZED,
      map: 'a',
      collections: [1, 2, 3],
    } as any

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      map: action.map,
      collections: action.collections,
    })
  })

  test('MAP_DESERIALIZED', () => {
    const action = {
      type: mapTypes.MAP_DESERIALIZED,
      deserialized: {
        a: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      ...action.deserialized,
    })
  })

  test('MAP_MODE_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_MODE_UPDATED,
      mode: 'a',
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      mode: action.mode,
    })
  })

  test('MAP_BBOX_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_BBOX_UPDATED,
      bbox: [1, 2, 3, 4],
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      bbox: action.bbox,
    })
  })

  test('MAP_BBOX_CLEARED', () => {
    const state = {
      ...mapInitialState,
      bbox: [1, 2, 3, 4],
      searchResults: 'a',
      searchError: 'a',
      selectedFeature: {
        properties: {
          type: 'NON_IGNORED_TYPE',
        },
      },
    } as any

    const action = { type: mapTypes.MAP_BBOX_CLEARED }

    // Should auto deselect job.
    expect(mapReducer(state, action)).toEqual({
      ...state,
      bbox: null,
      searchResults: null,
      searchError: null,
      selectedFeature: null,
    })

    // Should not auto-deselect job.
    state.selectedFeature.properties.type = TYPE_JOB
    expect(mapReducer(state, action)).toEqual({
      ...state,
      bbox: null,
      searchResults: null,
      searchError: null,
    })
  })

  test('MAP_DETECTIONS_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_DETECTIONS_UPDATED,
      detections: [1, 2, 3],
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      detections: action.detections,
    })
  })

  test('MAP_FRAMES_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_FRAMES_UPDATED,
      frames: [1, 2, 3],
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      frames: action.frames,
    })
  })

  test('MAP_SELECTED_FEATURE_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_SELECTED_FEATURE_UPDATED,
      selectedFeature: 'a',
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      selectedFeature: action.selectedFeature,
    })
  })

  test('MAP_HOVERED_FEATURE_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_HOVERED_FEATURE_UPDATED,
      hoveredFeature: 'a',
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      hoveredFeature: action.hoveredFeature,
    })
  })

  test('MAP_VIEW_UPDATED', () => {
    const action = {
      type: mapTypes.MAP_VIEW_UPDATED,
      view: 'a',
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      view: action.view,
    })
  })

  test('MAP_PAN_TO_POINT', () => {
    const state = {
      ...mapInitialState,
      view: {
        basemapIndex: 0,
        point: null,
        zoom: null,
        extent: [1, 2, 3, 4],
      },
    } as any

    const action = {
      type: mapTypes.MAP_PAN_TO_POINT,
      point: [1, 2],
      zoom: 1,
    }

    expect(mapReducer(state, action)).toEqual({
      ...state,
      view: {
        ...state.view,
        center: action.point,
        zoom: action.zoom,
        extent: null,
      },
    })
  })

  test('MAP_PAN_TO_EXTENT', () => {
    const state = {
      ...mapInitialState,
      view: {
        basemapIndex: 0,
        point: [1, 2],
        zoom: 1,
        extent: null,
      },
    } as any

    const action = {
      type: mapTypes.MAP_PAN_TO_EXTENT,
      extent: [1, 2, 3, 4],
    }

    expect(mapReducer(state, action)).toEqual({
      ...state,
      view: {
        ...state.view,
        extent: action.extent,
        center: null,
        zoom: null,
      },
    })
  })
})
