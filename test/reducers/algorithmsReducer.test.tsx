
import {algorithmsInitialState, algorithmsReducer} from '../../src/reducers/algorithmsReducer'
import {types} from '../../src/actions/algorithmsActions'

describe('algorithmsReducer', () => {
  it('initial state', () => {
    expect(algorithmsReducer(undefined, {})).toEqual(algorithmsInitialState)
  })

  it('ALGORITHMS_DESERIALIZED', () => {
    const action = {
      type: types.ALGORITHMS_DESERIALIZED,
      deserialized: {
        some: 'data',
      },
    }

    expect(algorithmsReducer(algorithmsInitialState, action)).toEqual({
      ...algorithmsInitialState,
      ...action.deserialized,
    })
  })

  it('ALGORITHMS_FETCHING', () => {
    const state = {
      ...algorithmsInitialState,
      fetchError: 'someError',
    }

    const action = { type: types.ALGORITHMS_FETCHING }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: true,
      fetchError: null,
    })
  })

  it('ALGORITHMS_FETCH_SUCCESS', () => {
    const state = {
      ...algorithmsInitialState,
      isFetching: true,
    }

    const action = {
      type: types.ALGORITHMS_FETCH_SUCCESS,
      records: [1, 2, 3],
    }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      records: action.records,
    })
  })

  it('ALGORITHMS_FETCH_ERROR', () => {
    const state = {
      ...algorithmsInitialState,
      isFetching: true,
    }

    const action = {
      type: types.ALGORITHMS_FETCH_ERROR,
      error: 'someError',
    }

    expect(algorithmsReducer(state, action)).toEqual({
      ...state,
      isFetching: false,
      fetchError: action.error,
    })
  })
})
