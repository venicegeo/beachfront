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
import axios, {AxiosResponse} from 'axios'
import {getClient} from '../api/session'

const MB = 1024000
const TIMEOUT = 600000

interface Props {
  className?:   string
  filename:     string
  jobId:        string
  apiUrl:       string
  displayText:  string
  onComplete()
  onError(err: any)
  onProgress(loaded: number, total: number)
  onStart()
}

interface State {
  blobUrl?:       string
  isDownloading?: boolean
  loaded?:        number
  total?:         number
}

export class FileDownloadLink extends React.Component<Props, State> {
  refs: any
  private cancel: any

  constructor() {
    super()
    this.state = {blobUrl: undefined, isDownloading: false, loaded: null, total: null}
    this.handleClick = this.handleClick.bind(this)
    this.handleComplete = this.handleComplete.bind(this)
    this.handleError = this.handleError.bind(this)
    this.handleProgress = this.handleProgress.bind(this)
  }

  componentDidUpdate(_: Props, prevState: State) {
    const downloadFinished = prevState.isDownloading && !this.state.isDownloading
    const receivedBlobUrl = !prevState.blobUrl && this.state.blobUrl
    if (downloadFinished && receivedBlobUrl) {
      this.triggerDownload()
    }
  }

  componentWillUnmount() {
    if (typeof this.cancel === 'function') {
      // TODO -- warn before close menu
      console.warn('TODO: Warn user that download has canceled')
      this.cancel()
    }
  }

  render() {
    const {isDownloading} = this.state
    const totalMegabytes = Math.round((this.state.total / MB) * 10) / 10
    const percentage = (Math.floor((this.state.loaded / this.state.total) * 100) || 0) + '%'
    return (
      <a
        ref="hyperlink"
        href={this.state.blobUrl}
        download={this.props.filename}
        className={this.props.className}
        title={isDownloading ? `Retrieving ${totalMegabytes} MB...` : this.props.displayText}
        onClick={this.handleClick}
      >
        {this.state.isDownloading ? percentage : <i className="fa fa-cloud-download"/>}
      </a>
    )
  }

  private handleClick() {
    if (this.state.isDownloading || this.state.blobUrl) {
      return  // Nothing to do
    }

    this.setState({
      isDownloading: true,
    })
    this.props.onStart()

    const client = getClient()
    client.get(this.props.apiUrl, {
      cancelToken: new axios.CancelToken(cancel => this.cancel = cancel),
      onDownloadProgress: this.handleProgress,
      responseType: 'blob',
      timeout: TIMEOUT,
    })
      .then(this.handleComplete)
      .catch(this.handleError)
  }

  private handleComplete(response: AxiosResponse) {
    const file = new File([response.data], this.props.filename, {type: 'application/json'})
    this.setState({
      blobUrl: URL.createObjectURL(file),
      isDownloading: false,
    })
    this.props.onComplete()
  }

  private handleError(err) {
    this.setState({
      isDownloading: false,
    })
    if (axios.isCancel(err)) {
      return
    }
    this.props.onError(err)
  }

  private handleProgress({ loaded, total }) {
    this.setState({
      loaded,
      total,
    })
    this.props.onProgress(loaded, total)
  }

  private triggerDownload() {
    this.refs.hyperlink.click()
  }
}
