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
import {findDOMNode} from 'react-dom'
import {FileDownloadLink} from './FileDownloadLink'
import wrap = require('lodash/wrap')
import {JOB_ENDPOINT} from '../config'

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
  errors?: any
  isActive?: boolean
  isDownloading?: boolean
  isOpen?: boolean
  percentage?: number
}

interface DownloadType {
  extension: string
  icon: string
  mimetype: string
  name: string
}

const JobDownloadErrors = (props: any) => {
  return Object.keys(props.errors).length ? <div className={styles.error}>
    <div className={styles.close} title="Dismiss" onClick={props.dismiss}>&times;</div>
    <div className={styles.header}>
      Job Download Error [{Object.keys(props.errors).join(', ')}]
    </div>
    <div className={styles.messages}>
      {Object.keys(props.errors).map(key => {
        return <div className={styles.message} key={key}>
          <div className={styles.short}>{props.errors[key].message}</div>
          <div className={styles.stack}>{props.errors[key].stack}</div>
        </div>
      })}
    </div>
  </div> : null
}

export class JobDownload extends React.Component<Props, State> {
  refs: any

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
    {
      extension: 'shp.zip',
      icon: 'object-ungroup',
      mimetype: 'application/zip',
      name: 'Shapefile',
    },
  ]

  downloads = {}

  constructor(props: Props) {
    super(props)

    this.state = {
      errors: [],
      isActive: false,
      isDownloading: false,
      isOpen: false,
    }

    this.dismissErrors = this.dismissErrors.bind(this)
    this.handleClick = this.handleClick.bind(this)
    this.onComplete = this.onComplete.bind(this)
    this.onError = this.onError.bind(this)
    this.onProgress = this.onProgress.bind(this)
    this.onStart = this.onStart.bind(this)
    this.setOffset = this.setOffset.bind(this)
  }

  componentWillReceiveProps(nextProps: Props) {
    if (this.props.isHover !== nextProps.isHover) {
      const isActive = this.isDownloading || nextProps.isHover && this.state.isOpen

      if (this.state.isActive !== isActive) {
        if (isActive) {
          this.setState({ isActive })
        } else {
          this.setState({ isActive, isOpen: false })
        }
      }

      // HACK
      if (this.props.isHover) {
        this.setOffset()
      }
    }
  }

  render() {
    const DownloadTypesList = this.downloadtypes.map(i =>
      <li className={i.extension in this.state.errors ? styles.error : ''} key={i.extension}>
        <FileDownloadLink
          apiUrl={`${JOB_ENDPOINT}/${this.props.jobId}.${i.extension}`}
          displayText={`Download ${i.name}`}
          filename={`${this.props.basename}.${i.extension}`}
          icon={i.icon}
          jobId={this.props.jobId}
          mimetype={i.mimetype}
          onComplete={wrap(i.extension, this.onComplete)}
          onError={wrap(i.extension, this.onError)}
          onProgress={wrap(i.extension, this.onProgress)}
          onStart={wrap(i.extension, this.onStart)}
        >{i.name}</FileDownloadLink>
      </li>
    )

    return (
      <div
        className={[
          this.props.className,
          styles.root,
          Object.keys(this.state.errors).length ? styles.errors : null,
        ].filter(Boolean).join(' ')}
      >
        <a onClick={this.handleClick} title="Download">
          {this.state.isDownloading
            ? `${isNaN(this.state.percentage) ? '—' : this.state.percentage}%`
            : <i className="fa fa-download"/>
          }
        </a>
        {this.state.isActive && <ul ref="ul" className={styles.list}>{DownloadTypesList}</ul>}
        <JobDownloadErrors errors={this.state.errors} dismiss={this.dismissErrors}/>
      </div>
    )
  }

  private get isDownloading() {
    return !!Object.keys(this.downloads).length
  }

  private get loaded() {
    return Object.keys(this.downloads).reduce((a, k) => a + (this.downloads[k].loaded || 0), 0)
  }

  private get total() {
    return Object.keys(this.downloads).reduce((a, k) => a + (this.downloads[k].total || 0), 0)
  }

  private get percentage() {
    return this.total ? Math.floor(100 * this.loaded / this.total) : NaN
  }

  private handleClick() {
    this.setState({
      isActive: this.state.isDownloading || !this.state.isOpen,
      isOpen: !this.state.isOpen,
    }, () => this.setOffset(this.refs.ul))
  }

  private dismissErrors() {
    this.setState({ errors: [] })
  }

  private onComplete(key) {
    delete this.downloads[key]
    this.setState({
      isActive: this.isDownloading || this.props.isHover && this.state.isOpen,
      isDownloading: this.isDownloading,
      percentage: this.percentage,
    })

    if (!this.isDownloading) {
      this.props.onComplete()
    }
  }

  private onError(key, error) {
    console.warn(`Downloading ${key} failed: ${error.message}`)
    delete this.downloads[key]
    this.setState({
      errors: Object.assign({}, this.state.errors, { [key]: error }),
      isActive: this.isDownloading || this.props.isHover && this.state.isOpen,
      isDownloading: this.isDownloading,
      percentage: this.percentage,
    })

    if (!this.isDownloading) {
      this.props.onError(error)
    }
  }

  private onProgress(key, loaded, total) {
    this.downloads[key] = { loaded, total }
    this.setState({ percentage: this.percentage })
    this.props.onProgress(this.loaded, this.total)
  }

  private onStart(key) {
    this.downloads[key] = {}
    this.setState({
      isActive: true,
      isDownloading: this.isDownloading,
      percentage: this.percentage,
    })
    this.props.onStart()
  }

  /*
   * This method is a hack to enable the list of download types to appear above
   * the JobStatusList header without always messing up the scrollbar.  I'm
   * doing direct element style manipulation to avoid passing too much trivial
   * information up and down the react component stack and rewriting some of
   * those components to use the values.
   */
  private setOffset(add?: any) {
    const e = (findDOMNode(this) as Element).closest('li.JobStatus-root').closest('ul') as HTMLElement

    if (add) {
      e.style.paddingTop = `${e.offsetTop}px`
      e.style.top = '0'
    } else {
      e.style.top = e.style.paddingTop = ''
    }
  }
}
