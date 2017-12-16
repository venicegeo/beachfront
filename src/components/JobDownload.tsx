/**
 * Copyright 2017, RadiantBlue Technologies, Inc.
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

const styles: any = require('./JobDownload.css')

import * as React from 'react'
import {FileDownloadLink} from './FileDownloadLink'

interface Props {
  basename: string
  className?: string
  isHover: boolean
  jobId: string
  onComplete()
  onError(err: any)
  onProgress(loaded: number, total: number)
  onStart()
}

interface State {
  isActive?: boolean
  isOpen?: boolean
}

interface DownloadType {
  extension: string
  icon: string
  mimetype: string
  name: string
}

export class JobDownload extends React.Component<Props, State> {
  downloadtypes: DownloadType[] = [
    {
      extension: 'geojson',
      icon: 'map',
      mimetype: 'application/vnd.geo+json',
      name: 'GeoJSON',
    },
    {
      extension: 'gpkg',
      icon: 'database',
      mimetype: 'application/x-sqlite3',
      name: 'GeoPackage',
    },
  ]

  constructor(props) {
    super(props)

    this.state = {
      isActive: false,
      isOpen: false,
    }

    this.download = this.download.bind(this)
    this.handleClick = this.handleClick.bind(this)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.isHover !== nextProps.isHover) {
      const isActive = nextProps.isHover && this.state.isOpen

      if (this.state.isActive !== isActive) {
        if (isActive) {
          this.setState({ isActive })
        } else {
          this.setState({ isActive, isOpen: false })
        }
      }
    }
  }

  render() {
    const DownloadTypesList = this.downloadtypes.map(i =>
      <li key={i.extension}>
        <FileDownloadLink
          apiUrl={`/v0/job/${this.props.jobId}.${i.extension}`}
          displayText={`Download ${i.name}`}
          filename={`${this.props.basename}.${i.extension}`}
          jobId={this.props.jobId}
          mimetype={i.mimetype}
          onComplete={this.props.onComplete}
          onError={this.props.onError}
          onProgress={this.props.onProgress}
          onStart={this.props.onStart}
        ><i className={`fa fa-${i.icon}`}/> {i.name}</FileDownloadLink>
      </li>
    )

    return (
      <div
        className={[this.props.className, styles.root].filter(Boolean).join(' ')}
      >
        <a onClick={this.handleClick} title="Download"><i className="fa fa-cloud-download"/></a>
        {this.state.isActive && <ul>{DownloadTypesList}</ul>}
      </div>
    )
  }

  private download(option) {
    console.debug('>>> option:', option, '<<<')
  }

  private handleClick() {
    this.setState({
      isActive: !this.state.isOpen,
      isOpen: !this.state.isOpen,
    })
  }
}
