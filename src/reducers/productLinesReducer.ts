
import {Collection, createCollection} from '../utils/collections'

export type ProductLinesState = Collection<beachfront.ProductLine>

export const productLinesInitialState = createCollection()

export function productLinesReducer(state = productLinesInitialState, action: any) {
  switch (action.type) {
    default:
      return state
  }
}
