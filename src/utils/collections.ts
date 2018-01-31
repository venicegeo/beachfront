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

// TODO -- consider feasibility of ImmutableJS...

export interface Collection<T> {
  error: any
  fetching: boolean
  records: T[]

  $append(record: T): Collection<T>
  $error(error: any): Collection<T>
  $fetching(): Collection<T>
  $filter(func: (record: T) => boolean): Collection<T>
  $map(func: (record: T) => T): Collection<T>
  $records(records: T[]): Collection<T>
}

export const createCollection = (initialRecords = []) => ({
  error:    null,
  fetching: false,
  records: initialRecords,

  $append(record) {
    return Object.assign({}, this, {records: this.records.concat(record)})
  },

  $fetching() {
    return Object.assign({}, this, {fetching: true})
  },

  $filter(func) {
    return Object.assign({}, this, {records: this.records.filter(func)})
  },

  $map(func) {
    return Object.assign({}, this, {records: this.records.map(func)})
  },

  $records(records) {
    return Object.assign({}, this, {records, error: null, fetching: false})
  },

  $error(error) {
    return Object.assign({}, this, {error, fetching: false})
  },
})
