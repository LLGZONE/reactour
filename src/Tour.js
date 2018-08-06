import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import ExecutionEnvironment from 'exenv'
import TourPortal from './TourPortal'
import './tour-portal.css'

const SafeHTMLElement = ExecutionEnvironment.canUseDOM ? window.HTMLElement : {}

function getParentElement(parentSelector) {
  return parentSelector()
}

class Tour extends Component {
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    portalClassName: PropTypes.string,
    appElement: PropTypes.instanceOf(SafeHTMLElement),
    onAfterOpen: PropTypes.func,
    onRequestClose: PropTypes.func,
    closeWithMask: PropTypes.bool,
    parentSelector: PropTypes.func,
  }

  static defaultProps = {
    isOpen: false,
    portalClassName: 'reactour-portal',
    closeWithMask: true,
    parentSelector() {
      return document.body
    },
  }
  constructor(props) {
    super(props)
    this.node = document.createElement('div')
    this.node.className = this.props.portalClassName
    const parent = getParentElement(this.props.parentSelector)
    parent.appendChild(this.node)
  }

  componentDidMount() {
    this.renderPortal(this.props)
  }

  componentDidUpdate(prevProps) {
    const currentParent = getParentElement(prevProps.parentSelector)
    const newParent = getParentElement(this.props.parentSelector)

    if (newParent !== currentParent) {
      currentParent.removeChild(this.node)
      newParent.appendChild(this.node)
    }

    this.renderPortal(this.props)
  }

  componentWillUnmount() {
    this.removePortal()
  }

  renderPortal(props) {
    if (props.isOpen) {
      document.body.classList.add('reactour__body')
    } else {
      document.body.classList.remove('reactour__body')
    }
  }

  removePortal() {
    const parent = getParentElement(this.props.parentSelector)
    parent.removeChild(this.node)
    document.body.classList.remove('reactour__body')
  }

  render() {
    return ReactDOM.createPortal(<TourPortal {...this.props} />, this.node)
  }
}

export default Tour
