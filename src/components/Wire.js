import styled from 'styled-components'

const innerCircleWidth = 8
const outCircleWidth = 16
const outBorder = 1
const line = 50

const Wire = styled.div`
  position: absolute;
  background-color: white;
  border-radius: 50%;
  width: ${innerCircleWidth}px;
  height: ${innerCircleWidth}px;
  transform: ${props => {
    switch (props.pos) {
      case 'right':
        return 'rotate(0deg)'
      case 'left':
        return 'rotate(180deg)'
      case 'top':
        return 'rotate(-90deg)'
      case 'bottom':
        return 'rotate(90deg)'
      default:
        return 'rotate(0deg)'
    }
  }};
  top: ${props => {
    switch (props.pos) {
      case 'left':
      case 'right':
        return `${(props.helperHeight - innerCircleWidth) / 2}px`
      case 'top':
        return `${line +
          props.helperHeight +
          (outCircleWidth - innerCircleWidth) / 2}px`
      case 'bottom':
        return `-${line + innerCircleWidth / 2 + outCircleWidth / 2}px`
      default:
        return 'rotate(0deg)'
    }
  }};
  left: ${props => {
    switch (props.pos) {
      case 'top':
      case 'bottom':
        return `${(props.helperWidth - innerCircleWidth) / 2}px`
      case 'left':
        return `${line +
          props.helperWidth +
          (outCircleWidth - innerCircleWidth) / 2}px`
      case 'right':
        return `${-(line + innerCircleWidth / 2 + outCircleWidth / 2)}px`
    }
  }};

  &:before {
    content: '';
    display: block;
    background-color: transparent;
    border-radius: 50%;
    border: ${outBorder}px solid white;
    width: ${outCircleWidth}px;
    height: ${outCircleWidth}px;
    position: absolute;
    left: 0;
    top: 0;
    transform: translate(
      -${innerCircleWidth / 2}px,
      -${innerCircleWidth / 2}px
    );
  }

  &:after {
    content: '';
    display: block;
    position: absolute;
    left: 12px;
    top: 3px;
    width: ${line}px;
    height: 1.5px;
    background-color: white;
  }
`

export default Wire
