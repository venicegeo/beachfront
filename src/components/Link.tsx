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

import * as React from 'react'

interface Props {
  activeClassName?: string
  children?: any
  className?: string
  hash?: string
  isActive?: boolean
  pathname: string
  search?: string
  title?: string
  onClick(loc: { pathname: string, search: string, hash: string })
}

export const Link = ({
  activeClassName,
  children,
  className,
  hash = '',
  isActive,
  pathname,
  search = '',
  title,
  onClick,
}: Props) => (
  <a
    href={pathname + search + hash}
    className={[
      className,
      isActive || (isActive == null && location.pathname === pathname) ? activeClassName : '',
    ].filter(Boolean).join(' ')}
    title={title}
    onClick={event => {
      event.preventDefault()
      return onClick({ pathname, search, hash })
    }}
  >{children}</a>
)
