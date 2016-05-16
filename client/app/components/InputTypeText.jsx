import React, {Component} from 'react'
import styles from '../styles/common/forms.css'

export const TYPE_TEXT = 'text'

export default class InputTypeText extends Component {
  static propTypes = {
    name: React.PropTypes.string
  }

  render() {
    return (
      <label className={styles.normal}>
        <span>{this.props.name}</span>
        <input ref="input" type="text"/>
      </label>
    )
  }

  get value() {
    return this.refs.input.value
  }
}
