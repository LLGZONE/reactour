import React from 'react'
import ReactDOM from 'react-dom'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { Guide, Wire, SvgGuide } from './components'
import * as hx from './helpers'

function getParentElement(parentSelector = () => document.body) {
  return parentSelector()
}

class SimpleGuide extends React.Component {
  static propTypes = {
    highlightedMaskClassName: PropTypes.string,
    className: PropTypes.string,
    closeWithMask: PropTypes.bool,
    inViewThreshold: PropTypes.number,
    isOpen: PropTypes.bool.isRequired,
    maskClassName: PropTypes.string,
    maskSpace: PropTypes.number,
    helperSpace: PropTypes.number,
    onAfterOpen: PropTypes.func,
    onBeforeClose: PropTypes.func,
    onRequestClose: PropTypes.func,
    scrollDuration: PropTypes.number,
    scrollOffset: PropTypes.number,
    step: PropTypes.shape({
      selector: PropTypes.string,
      content: PropTypes.oneOfType([
        PropTypes.node,
        PropTypes.element,
        PropTypes.func,
      ]).isRequired,
      position: PropTypes.oneOf(['top', 'right', 'bottom', 'left', 'center']),
      action: PropTypes.func,
      style: PropTypes.object,
      stepInteraction: PropTypes.bool,
    }),
    update: PropTypes.string,
    updateDelay: PropTypes.number,
    disableInteraction: PropTypes.bool,
    rounded: PropTypes.number,
    accentColor: PropTypes.string,
    helperOffset: PropTypes.number,
  }

  static defaultProps = {
    onAfterOpen: () => {
      document.body.style.overflowY = 'hidden'
    },
    onBeforeClose: () => {
      document.body.style.overflowY = 'auto'
    },
    scrollDuration: 1,
    maskSpace: 10,
    updateDelay: 1,
    disableInteraction: false,
    rounded: 0,
    accentColor: '#007aff',
    helperSpace: 85,
    helperOffset: 0,
  }

  constructor() {
    super()
    this.state = {
      isOpen: false,
      current: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      w: 0,
      h: 0,
      helperOffset: 0,
    }
  }

  componentDidMount() {
    const { isOpen, startAt } = this.props
    if (isOpen) {
      this.open(startAt)
    }
  }

  componentDidUpdate(prevProps) {
    const { isOpen } = prevProps

    if (!isOpen && this.props.isOpen) {
      this.open(this.props.startAt)
    } else if (isOpen && !this.props.isOpen) {
      this.close()
    }
  }

  componentWillUnmount() {
    const { isOpen } = this.props
    if (isOpen) {
      this.close()
    }
  }

  open(startAt) {
    const { onAfterOpen } = this.props
    this.setState(
      prevState => ({
        isOpen: true,
        current: startAt !== undefined ? startAt : prevState.current,
      }),
      () => {
        this.showStep()
        this.helper.focus()
        if (onAfterOpen) {
          onAfterOpen()
        }
      }
    )
    // TODO: debounce it.
    window.addEventListener('resize', this.showStep, false)
    window.addEventListener('keydown', this.keyDownHandler, false)
  }

  showStep = () => {
    const { step } = this.props
    const { current } = this.state
    const node = step.selector ? document.querySelector(step.selector) : null

    const stepCallback = o => {
      if (step.action && typeof step.action === 'function') {
        step.action(o)
      }

      if (step.helperOffset) {
        this.setState(prevState => {
          const target = {
            w: prevState.width,
            h: prevState.height,
          }
          const helper = {
            w: prevState.helperWidth,
            h: prevState.helperHeight,
          }
          return {
            helperOffset: step.helperOffset(
              target,
              helper,
              this.props.maskSpace
            ),
          }
        })
      } else {
        this.setState({ helperOffset: 0 })
      }
    }

    if (node) {
      const cb = () => stepCallback(node)
      this.calculateNode(node, step.position, cb)
    } else {
      this.setState(
        setNodeState(null, this.helper, step.position),
        stepCallback
      )

      step.selector &&
        console.warn(
          `Doesn't find a DOM node '${step.selector}'.
                    Please check the 'steps' Tour prop Array at position: ${current +
                      1}.`
        )
    }
  }

  calculateNode = (node, stepPosition, cb) => {
    this.setState(setNodeState(node, this.helper, stepPosition), cb)
  }

  close() {
    this.setState(prevState => {
      return {
        isOpen: false,
      }
    }, this.onBeforeClose)
    window.removeEventListener('resize', this.showStep)
    window.removeEventListener('keydown', this.keyDownHandler)
  }

  onBeforeClose() {
    const { onBeforeClose } = this.props
    if (onBeforeClose) {
      onBeforeClose()
    }
  }

  keyDownHandler = e => {
    const { onRequestClose } = this.props
    e.stopPropagation()

    if (e.keyCode === 27) {
      // esc
      e.preventDefault()
      onRequestClose()
    }
  }

  render() {
    const {
      className,
      step,
      maskClassName,
      maskSpace,
      highlightedMaskClassName,
      disableInteraction,
      rounded,
      accentColor,
      helperSpace,
    } = this.props

    const {
      isOpen,
      current,
      top: targetTop,
      right: targetRight,
      bottom: targetBottom,
      left: targetLeft,
      width: targetWidth,
      height: targetHeight,
      w: windowWidth,
      h: windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      helperOffset,
    } = this.state

    if (isOpen) {
      return (
        <div>
          <div
            ref={c => (this.mask = c)}
            onClick={this.maskClickHandler}
            className={cn(CN.mask.base, {
              [CN.mask.isOpen]: isOpen,
            })}
          >
            <SvgGuide
              windowWidth={windowWidth}
              windowHeight={windowHeight}
              targetWidth={targetWidth}
              targetHeight={targetHeight}
              targetTop={targetTop}
              targetLeft={targetLeft}
              padding={maskSpace}
              rounded={rounded}
              className={maskClassName}
              disableInteraction={
                disableInteraction && step.stepInteraction
                  ? !step.stepInteraction
                  : disableInteraction
              }
              disableInteractionClassName={`${
                CN.mask.disableInteraction
              } ${highlightedMaskClassName}`}
            />
          </div>
          <Guide
            innerRef={c => (this.helper = c)}
            targetHeight={targetHeight}
            targetWidth={targetWidth}
            targetTop={targetTop}
            targetRight={targetRight}
            targetBottom={targetBottom}
            targetLeft={targetLeft}
            windowWidth={windowWidth}
            windowHeight={windowHeight}
            helperWidth={helperWidth}
            helperHeight={helperHeight}
            helperPosition={helperPosition}
            padding={helperSpace}
            maskSpace={maskSpace}
            tabIndex={-1}
            current={current}
            style={step.style ? step.style : {}}
            rounded={rounded}
            className={cn(CN.helper.base, className, {
              [CN.helper.isOpen]: isOpen,
            })}
            accentColor={accentColor}
            helperOffset={helperOffset}
          >
            <Wire
              helperHeight={helperHeight}
              helperWidth={helperWidth}
              pos={helperPosition}
            />
            {step.content}
          </Guide>
        </div>
      )
    }

    return <div />
  }
}

class GuidePortal extends React.Component {
  constructor(props) {
    super(props)
    this.node = document.createElement('div')
    this.node.className = this.props.portalClassName
    const parent = getParentElement(this.props.parentSelector)
    parent.appendChild(this.node)
  }

  componentDidUpdate(prevProps) {
    const currentParent = getParentElement(prevProps.parentSelector)
    const newParent = getParentElement(this.props.parentSelector)

    if (newParent !== currentParent) {
      currentParent.removeChild(this.node)
      newParent.appendChild(this.node)
    }
  }

  componentWillUnmount() {
    this.removePortal()
  }

  removePortal() {
    const parent = getParentElement(this.props.parentSelector)
    parent.removeChild(this.node)
  }

  render() {
    return ReactDOM.createPortal(<SimpleGuide {...this.props} />, this.node)
  }
}

const CN = {
  mask: {
    base: 'reactour__mask',
    isOpen: 'reactour__mask--is-open',
    disableInteraction: 'reactour__mask--disable-interaction',
  },
  helper: {
    base: 'reactour__helper',
    isOpen: 'reactour__helper--is-open',
  },
}

const setNodeState = (node, helper, position) => {
  const w = Math.max(
    document.documentElement.clientWidth,
    window.innerWidth || 0
  )
  const h = Math.max(
    document.documentElement.clientHeight,
    window.innerHeight || 0
  )
  const { width: helperWidth, height: helperHeight } = hx.getNodeRect(helper)
  const attrs = node
    ? hx.getNodeRect(node)
    : {
        top: h + 10,
        right: w / 2 + 9,
        bottom: h / 2 + 9,
        left: w / 2 - helperWidth / 2,
        width: 0,
        height: 0,
        w,
        h,
        helperPosition: 'center',
      }
  return function update() {
    return {
      w,
      h,
      helperWidth,
      helperHeight,
      helperPosition: position,
      ...attrs,
      inDOM: node ? true : false,
    }
  }
}

export function createGuide(step) {
  return <GuidePortal step={step} isOpen={true} />
}
