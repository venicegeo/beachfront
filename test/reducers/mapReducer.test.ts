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
import {MapActions} from '../../src/actions/mapActions'
import {TYPE_JOB} from '../../src/constants'

describe('mapReducer', () => {
  test('initialState', () => {
    expect(mapReducer(undefined, { type: null })).toEqual(mapInitialState)
  })

  test('MAP_INITIALIZED', () => {
    const action = {
      type: MapActions.Initialized.type,
      payload: {
        map: 'a',
        collections: 'b',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      map: action.payload.map,
      collections: action.payload.collections,
    })
  })

  test('MAP_MODE_UPDATED', () => {
    const action = {
      type: MapActions.ModeUpdated.type,
      payload: {
        mode: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      mode: action.payload.mode,
    })
  })

  test('MAP_BBOX_UPDATED', () => {
    const action = {
      type: MapActions.BboxUpdated.type,
      payload: {
        bbox: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      bbox: action.payload.bbox,
    })
  })

  test('MAP_BBOX_CLEARED', () => {
    const state = {
      ...mapInitialState,
      bbox: 'a',
      selectedFeature: {
        properties: {
          type: 'd',
        },
      },
    } as any

    const action = { type: MapActions.BboxCleared.type }

    // Should auto deselect feature.
    expect(mapReducer(state, action)).toEqual({
      ...state,
      bbox: null,
      selectedFeature: null,
    })

    // Should not auto-deselect feature.
    state.selectedFeature.properties.type = TYPE_JOB
    expect(mapReducer(state, action)).toEqual({
      ...state,
      bbox: null,
    })
  })

  test('MAP_DETECTIONS_UPDATED', () => {
    const action = {
      type: MapActions.DetectionsUpdated.type,
      payload: {
        detections: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      detections: action.payload.detections,
    })
  })

  test('MAP_FRAMES_UPDATED', () => {
    const action = {
      type: MapActions.FramesUpdated.type,
      payload: {
        frames: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      frames: action.payload.frames,
    })
  })

  test('MAP_SELECTED_FEATURE_UPDATED', () => {
    const action = {
      type: MapActions.SelectedFeatureUpdated.type,
      payload: {
        selectedFeature: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      selectedFeature: action.payload.selectedFeature,
    })
  })

  test('MAP_HOVERED_FEATURE_UPDATED', () => {
    const action = {
      type: MapActions.HoveredFeatureUpdated.type,
      payload: {
        hoveredFeature: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      hoveredFeature: action.payload.hoveredFeature,
    })
  })

  test('MAP_VIEW_UPDATED', () => {
    const action = {
      type: MapActions.ViewUpdated.type,
      payload: {
        view: 'a',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      view: action.payload.view,
    })
  })

  test('MAP_PAN_TO_POINT', () => {
    const state = {
      ...mapInitialState,
      view: {
        basemapIndex: 'a',
        point: null,
        zoom: null,
        extent: 'b',
      },
    } as any

    const action = {
      type: MapActions.PanToPoint.type,
      payload: {
        point: 'c',
        zoom: 'd',
      },
    }

    expect(mapReducer(state, action)).toEqual({
      ...state,
      view: {
        ...state.view,
        center: action.payload.point,
        zoom: action.payload.zoom,
        extent: null,
      },
    })
  })

  test('MAP_PAN_TO_EXTENT', () => {
    const state = {
      ...mapInitialState,
      view: {
        basemapIndex: 'a',
        point: 'b',
        zoom: 'c',
        extent: null,
      },
    } as any

    const action = {
      type: MapActions.PanToExtent.type,
      payload: {
        extent: 'd',
      },
    }

    expect(mapReducer(state, action)).toEqual({
      ...state,
      view: {
        ...state.view,
        extent: action.payload.extent,
        center: null,
        zoom: null,
      },
    })
  })

  test('MAP_DESERIALIZED', () => {
    const action = {
      type: MapActions.Deserialized.type,
      payload: {
        bbox: 'a',
        view: 'b',
      },
    }

    expect(mapReducer(mapInitialState, action)).toEqual({
      ...mapInitialState,
      bbox: action.payload.bbox,
      view: action.payload.view,
    })
  })
})
