/**
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
 **/

import {MapActions as Actions} from '../actions/mapActions'
import {MapView, MODE_NORMAL} from '../components/PrimaryMap'
import {TYPE_JOB} from '../constants'
import {shouldSelectedFeatureAutoDeselect} from '../utils/mapUtils'
import {Extent} from '../utils/geometries'
import {Action} from 'redux'

export interface MapCollections {
  readonly hovered: ol.Collection<ol.Feature>
  readonly imagery: ol.Collection<ol.Feature>
  readonly selected: ol.Collection<ol.Feature>
  readonly handleSelectFeature: (featureOrId: any) => void
}

export interface MapState {
  map: ol.Map | null
  view: MapView | null
  mode: string
  detections: (beachfront.Job | beachfront.ProductLine)[]
  frames: (beachfront.Job | beachfront.ProductLine)[]
  bbox: Extent | null
  hoveredFeature: beachfront.Job | null
  collections: MapCollections | null
  selectedFeature: GeoJSON.Feature<any> | null
}

export const mapInitialState: MapState = {
  map: null,
  mode: MODE_NORMAL,
  view: null,
  detections: [],
  frames: [],
  bbox: null,
  hoveredFeature: null,
  collections: null,
  selectedFeature: null,
}

export function mapReducer(state = mapInitialState, action: Action): MapState {
  switch (action.type) {
    case Actions.Initialized.type: {
      const payload = (action as Actions.Initialized).payload
      return {
        ...state,
        map: payload.map,
        collections: payload.collections,
      }
    }
    case Actions.ModeUpdated.type: {
      const payload = (action as Actions.ModeUpdated).payload
      return {
        ...state,
        mode: payload.mode,
      }
    }
    case Actions.BboxUpdated.type: {
      const payload = (action as Actions.BboxUpdated).payload
      return {
        ...state,
        bbox: payload.bbox,
      }
    }
    case Actions.BboxCleared.type: {
      let selectedFeature = state.selectedFeature
      if (shouldSelectedFeatureAutoDeselect(selectedFeature, { ignoreTypes: [TYPE_JOB] })) {
        selectedFeature = null
      }

      return {
        ...state,
        bbox: null,
        selectedFeature,
      }
    }
    case Actions.DetectionsUpdated.type: {
      const payload = (action as Actions.DetectionsUpdated).payload
      return {
        ...state,
        detections: payload.detections,
      }
    }
    case Actions.FramesUpdated.type: {
      const payload = (action as Actions.FramesUpdated).payload
      return {
        ...state,
        frames: payload.frames,
      }
    }
    case Actions.SelectedFeatureUpdated.type: {
      const payload = (action as Actions.SelectedFeatureUpdated).payload
      return {
        ...state,
        selectedFeature: payload.selectedFeature,
      }
    }
    case Actions.HoveredFeatureUpdated.type: {
      const payload = (action as Actions.HoveredFeatureUpdated).payload
      return {
        ...state,
        hoveredFeature: payload.hoveredFeature,
      }
    }
    case Actions.ViewUpdated.type: {
      const payload = (action as Actions.ViewUpdated).payload
      return {
        ...state,
        view: payload.view,
      }
    }
    case Actions.PanToPoint.type: {
      const payload = (action as Actions.PanToPoint).payload
      return {
        ...state,
        view: {
          ...state.view!,
          center: payload.point,
          zoom: payload.zoom,
          extent: null,
        },
      }
    }
    case Actions.PanToExtent.type: {
      const payload = (action as Actions.PanToExtent).payload
      return {
        ...state,
        view: {
          ...state.view!,
          extent: payload.extent,
          center: null,
          zoom: null,
        },
      }
    }
    case Actions.Deserialized.type: {
      const payload = (action as Actions.Deserialized).payload
      return {
        ...state,
        bbox: payload.bbox,
        view: payload.view,
      }
    }
    default:
      return state
  }
}
