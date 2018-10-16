
import {types} from '../actions/jobsActions'

export type JobsState = {
  records: beachfront.Job[]
  fetching: boolean
  fetchError: any
  fetchingOne: boolean
  fetchOneError: any
  lastOneFetched: beachfront.Job | null
  deletingJob: boolean
  deletedJob: beachfront.Job | null
  deleteJobError: any
  creatingJob: boolean
  createdJob: beachfront.Job | null
  createJobError: any
}

export const jobsInitialState = {
  records: [],
  fetching: false,
  fetchError: null,
  fetchingOne: false,
  fetchOneError: null,
  lastOneFetched: null,
  deletingJob: false,
  deletedJob: null,
  deleteJobError: null,
  creatingJob: false,
  createdJob: null,
  createJobError: null,
}

export function jobsReducer(state = jobsInitialState, action: any) {
  switch (action.type) {
    case types.JOBS_FETCHING:
      return {
        ...state,
        fetching: true,
        fetchError: null,
      }
    case types.JOBS_FETCH_SUCCESS:
      return {
        ...state,
        fetching: false,
        records: action.records,
      }
    case types.JOBS_FETCH_ERROR:
      return {
        ...state,
        fetching: false,
        fetchError: action.error,
      }
    case types.JOBS_FETCHING_ONE:
      return {
        ...state,
        fetchingOne: true,
        fetchOneError: null,
      }
    case types.JOBS_FETCH_ONE_SUCCESS:
      return {
        ...state,
        fetchingOne: false,
        records: [...state.records, action.record],
        lastOneFetched: action.record,
      }
    case types.JOBS_FETCH_ONE_ERROR:
      return {
        ...state,
        fetchingOne: false,
        fetchOneError: action.error,
      }
    case types.JOBS_CREATING_JOB:
      return {
        ...state,
        creatingJob: true,
        createdJob: null,
        createJobError: null,
      }
    case types.JOBS_CREATE_JOB_SUCCESS:
      return {
        ...state,
        creatingJob: false,
        createdJob: action.job,
      }
    case types.JOBS_CREATE_JOB_ERROR:
      return {
        ...state,
        creatingJob: false,
        createJobError: action.error,
      }
    case types.JOBS_DISMISS_CREATE_JOB_ERROR:
      return {
        ...state,
        createJobError: null,
      }
    case types.JOBS_DELETING_JOB:
      return {
        ...state,
        records: state.records.filter(job => job.id !== action.job.id),
        deletingJob: true,
        deletedJob: action.job,
        deleteJobError: null,
      }
    case types.JOBS_DELETE_JOB_SUCCESS:
      return {
        ...state,
        deletingJob: false,
      }
    case types.JOBS_DELETE_JOB_ERROR:
      return {
        ...state,
        records: [...state.records, state.deletedJob],
        deletingJob: false,
        deleteJobError: action.error,
      }
    default:
      return state
  }
}
