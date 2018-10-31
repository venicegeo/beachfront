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

export function mod(n: number, m: number) {
  // Perform a proper modulo operation (in JavaScript % actually performs a remainder operation).
  return ((n % m) + m) % m
}

export function wrap(n: number, min: number, max: number) {
  // Wrap n between min and max (inclusive for min and exclusive for max).
  const range = max - min
  return min + mod(n - min, range)
}
