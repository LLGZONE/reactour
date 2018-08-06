import styled from 'styled-components'
import * as hx from '../helpers'

const Guide = styled.div`
  --reactour-accent: ${props => props.accentColor};
  position: fixed;
  background-color: #fff;
  transition: transform 0.3s;
  padding: 24px;
  box-shadow: 0 0.5em 3em rgba(0, 0, 0, 0.3);
  top: 0;
  left: 0;
  color: inherit;
  z-index: 1000000;
  max-width: 331px;
  min-width: 150px;
  outline: 0;
  border-radius: ${props => props.rounded}px;

  transform: ${props => {
    const {
      targetTop,
      targetRight,
      targetBottom,
      targetLeft,
      windowWidth,
      windowHeight,
      helperWidth,
      helperHeight,
      helperPosition,
      padding,
      maskSpace,
      targetWidth,
      targetHeight,
    } = props

    const available = {
      left: targetLeft,
      right: windowWidth - targetRight,
      top: targetTop,
      bottom: windowHeight - targetBottom,
    }

    const couldPositionAt = position => {
      return (
        available[position] >
        (hx.isHoriz(position)
          ? helperWidth + maskSpace * 2
          : helperHeight + maskSpace * 2)
      )
    }

    const autoPosition = coords => {
      const positionsOrder = hx.bestPositionOf(available)
      for (let j = 0; j < positionsOrder.length; j++) {
        if (couldPositionAt(positionsOrder[j])) {
          return coords[positionsOrder[j]]
        }
      }
      return coords.center
    }

    const pos = helperPosition => {
      const hX = hx.isOutsideX(targetLeft + helperWidth, windowWidth)
        ? hx.isOutsideX(targetRight + maskSpace, windowWidth)
          ? targetRight - helperWidth
          : targetRight - helperWidth + maskSpace
        : targetLeft - maskSpace
      const x = hX > maskSpace ? hX : maskSpace
      const hY = hx.isOutsideY(targetTop + helperHeight, windowHeight)
        ? hx.isOutsideY(targetBottom + maskSpace, windowHeight)
          ? targetBottom - helperHeight
          : targetBottom - helperHeight + maskSpace
        : targetTop - maskSpace
      const y = hY > maskSpace ? hY : maskSpace
      const coords = {
        top: [
          x - (helperWidth - targetWidth - maskSpace * 2) / 2,
          targetTop - helperHeight - maskSpace - padding,
        ],
        right: [
          targetRight + maskSpace + padding,
          y - (helperHeight - targetHeight - maskSpace * 2) / 2,
        ],
        bottom: [
          x - (helperWidth - targetWidth - maskSpace * 2) / 2,
          targetBottom + maskSpace + padding,
        ],
        left: [
          targetLeft - helperWidth - maskSpace - padding,
          y - (helperHeight - targetHeight - maskSpace * 2) / 2,
        ],
        center: [
          windowWidth / 2 - helperWidth / 2,
          windowHeight / 2 - helperHeight / 2,
        ],
      }
      if (helperPosition === 'center' || couldPositionAt(helperPosition)) {
        return coords[helperPosition]
      }
      return autoPosition(coords)
    }

    const p = pos(helperPosition)

    return `translate(${p[0]}px, ${p[1]}px)`
  }};
`

export default Guide
