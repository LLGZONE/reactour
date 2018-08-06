import React, { Component } from 'react'
import PropTypes from 'prop-types'
import cn from 'classnames'
import scrollSmooth from 'scroll-smooth'
import Scrollparent from 'scrollparent'
import { Arrow, Guide, Controls, SvgMask, Wire } from './components/index'
import * as hx from './helpers'

class TourPortal extends Component {
  static propTypes = {
    highlightedMaskClassName: PropTypes.string,
    className: PropTypes.string,
    closeWithMask: PropTypes.bool,
    inViewThreshold: PropTypes.number,
    isOpen: PropTypes.bool.isRequired,
    lastStepNextButton: PropTypes.node,
    maskClassName: PropTypes.string,
    maskSpace: PropTypes.number,
    helperSpace: PropTypes.number,
    nextButton: PropTypes.node,
    onAfterOpen: PropTypes.func,
    onBeforeClose: PropTypes.func,
    onRequestClose: PropTypes.func,
    closeButton: PropTypes.node,
    scrollDuration: PropTypes.number,
    scrollOffset: PropTypes.number,
    showButtons: PropTypes.bool,
    showNumber: PropTypes.bool,
    startAt: PropTypes.number,
    goToStep: PropTypes.number,
    getCurrentStep: PropTypes.func,
    nextStep: PropTypes.func,
    prevStep: PropTypes.func,
    steps: PropTypes.arrayOf(
      PropTypes.shape({
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
      })
    ),
    update: PropTypes.string,
    updateDelay: PropTypes.number,
    disableInteraction: PropTypes.bool,
    rounded: PropTypes.number,
    accentColor: PropTypes.string,
    nextButtonClassName: PropTypes.string,
    closeButtonClassName: PropTypes.string,
    helperOffset: PropTypes.number,
  }

  static defaultProps = {
    onAfterOpen: () => {
      document.body.style.overflowY = 'hidden'
    },
    onBeforeClose: () => {
      document.body.style.overflowY = 'auto'
    },
    showButtons: true,
    showNumber: true,
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
      inDOM: false,
      observer: null,
      helperOffset: 0,
    }
  }

  componentDidMount() {
    const { isOpen, startAt } = this.props
    if (isOpen) {
      this.open(startAt)
    }
  }

  static getDerivedStateFromProps(props, state) {
    const { steps, getCurrentStep } = props
    const n = props.goToStep
    const nextStep = steps[n] ? n : state.current

    if (typeof getCurrentStep === 'function') {
      getCurrentStep(nextStep)
    }

    if (nextStep !== state.current) {
      return {
        current: nextStep,
      }
    }
    return null
  }

  componentDidUpdate(prevProps, prevState) {
    const { isOpen, update, updateDelay } = prevProps

    if (!isOpen && this.props.isOpen) {
      this.open(this.props.startAt)
    } else if (isOpen && !this.props.isOpen) {
      this.close()
    }

    if (isOpen && update !== this.props.update) {
      if (this.props.steps[prevState.current]) {
        setTimeout(this.showStep, updateDelay)
      } else {
        this.props.onRequestClose()
      }
    }

    if (
      isOpen &&
      this.props.isOpen &&
      this.state.current !== this.props.goToStep &&
      this.state.current !== prevState.current
    ) {
      this.showStep()
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
    const { steps } = this.props
    const { current } = this.state
    const step = steps[current]
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
      }
    }

    if (step.observe) {
      const target = document.querySelector(step.observe)
      const config = { attributes: true, childList: true, characterData: true }
      this.setState(
        {
          observer: new MutationObserver(mutations => {
            mutations.forEach(mutation => {
              if (
                mutation.type === 'childList' &&
                mutation.addedNodes.length > 0
              ) {
                const cb = () => stepCallback(mutation.addedNodes[0])
                setTimeout(
                  () =>
                    this.calculateNode(
                      mutation.addedNodes[0],
                      step.position,
                      cb
                    ),
                  100
                )
              } else if (
                mutation.type === 'childList' &&
                mutation.removedNodes.length > 0
              ) {
                const cb = () => stepCallback(node)
                this.calculateNode(node, step.position, cb)
              }
            })
          }),
        },
        () => this.state.observer.observe(target, config)
      )
    } else {
      if (this.state.observer) {
        this.state.observer.disconnect()
        this.setState({
          observer: null,
        })
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
    const { scrollDuration, inViewThreshold, scrollOffset } = this.props
    const attrs = hx.getNodeRect(node)
    const w = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    )
    const h = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    )
    if (!hx.inView({ ...attrs, w, h, threshold: inViewThreshold })) {
      const parentScroll = Scrollparent(node)
      scrollSmooth.to(node, {
        context: hx.isBody(parentScroll) ? window : parentScroll,
        duration: scrollDuration,
        offset: scrollOffset || -(h / 2),
        callback: nd => {
          this.setState(setNodeState(nd, this.helper, stepPosition), cb)
        },
      })
    } else {
      this.setState(setNodeState(node, this.helper, stepPosition), cb)
    }
  }

  close() {
    this.setState(prevState => {
      if (prevState.observer) {
        prevState.observer.disconnect()
      }
      return {
        isOpen: false,
        observer: null,
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

  maskClickHandler = e => {
    const { closeWithMask, onRequestClose } = this.props
    if (
      closeWithMask &&
      !e.target.classList.contains(CN.mask.disableInteraction)
    ) {
      onRequestClose(e)
    }
  }

  nextStep = () => {
    const { steps, getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep =
        prevState.current < steps.length - 1
          ? prevState.current + 1
          : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  prevStep = () => {
    const { getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep =
        prevState.current > 0 ? prevState.current - 1 : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  gotoStep = n => {
    const { steps, getCurrentStep } = this.props
    this.setState(prevState => {
      const nextStep = steps[n] ? n : prevState.current

      if (typeof getCurrentStep === 'function') {
        getCurrentStep(nextStep)
      }

      return {
        current: nextStep,
      }
    }, this.showStep)
  }

  keyDownHandler = e => {
    const { onRequestClose, nextStep, prevStep } = this.props
    e.stopPropagation()

    if (e.keyCode === 27) {
      // esc
      e.preventDefault()
      onRequestClose()
    }
    if (e.keyCode === 39) {
      // right
      e.preventDefault()
      typeof nextStep === 'function' ? nextStep() : this.nextStep()
    }
    if (e.keyCode === 37) {
      // left
      e.preventDefault()
      typeof prevStep === 'function' ? prevStep() : this.prevStep()
    }
  }

  render() {
    const {
      className,
      steps,
      maskClassName,
      showButtons,
      onRequestClose,
      maskSpace,
      lastStepNextButton,
      nextButton,
      closeButton,
      highlightedMaskClassName,
      disableInteraction,
      nextStep,
      rounded,
      accentColor,
      nextButtonClassName,
      closeButtonClassName,
      helperSpace,
    } = this.props

    const {
      isOpen,
      current,
      inDOM,
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
            <SvgMask
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
                disableInteraction && steps[current].stepInteraction
                  ? !steps[current].stepInteraction
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
            style={steps[current].style ? steps[current].style : {}}
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
            {steps[current] &&
              (typeof steps[current].content === 'function'
                ? steps[current].content({
                    goTo: this.gotoStep,
                    inDOM,
                    step: current + 1,
                  })
                : steps[current].content)}
            {showButtons && (
              <Controls data-tour-elem="controls">
                {showButtons && (
                  <Arrow
                    onClick={onRequestClose}
                    label={closeButton ? closeButton : 'close'}
                    className={closeButtonClassName}
                  />
                )}

                {showButtons && (
                  <Arrow
                    onClick={
                      current === steps.length - 1
                        ? lastStepNextButton
                          ? onRequestClose
                          : () => {}
                        : typeof nextStep === 'function'
                          ? nextStep
                          : this.nextStep
                    }
                    inverted
                    disabled={
                      !lastStepNextButton && current === steps.length - 1
                    }
                    label={
                      lastStepNextButton && current === steps.length - 1
                        ? lastStepNextButton
                        : nextButton
                          ? nextButton
                          : 'next'
                    }
                    className={nextButtonClassName}
                  />
                )}
              </Controls>
            )}
          </Guide>
        </div>
      )
    }

    return <div />
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

export default TourPortal
