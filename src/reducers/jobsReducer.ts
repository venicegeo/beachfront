
import {Collection, createCollection} from '../utils/collections'

export type JobsState = Collection<beachfront.Job>

export const jobsInitialState = createCollection()

export function jobsReducer(state = jobsInitialState, action: any) {
  switch (action.type) {
    default:
      return state
  }
}
