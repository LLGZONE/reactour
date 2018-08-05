import React from 'react'
import styled from 'styled-components'
import SvgButton from './SvgButton'
import PropTypes from 'prop-types'

const Label = styled.span`
  font-size: 12px;
  line-height: 1;
`

function Arrow({ className, onClick, inverted, label, disabled }) {
  console.log(className)
  return (
    <SvgButton
      className={className}
      onClick={onClick}
      data-tour-elem={`${inverted ? 'right' : 'left'}-arrow`}
      disabled={disabled}
    >
      <Label>{label}</Label>
    </SvgButton>
  )
}

Arrow.propTypes = {
  className: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  inverted: PropTypes.bool,
  label: PropTypes.node,
  disabled: PropTypes.bool,
}

export default styled(Arrow)`
  color: ${props => (props.disabled ? '#caccce' : '#646464')};

  ${props => (props.inverted ? 'margin-left: 6px;' : 'margin-right: 6px;')};
  ${props =>
    !props.label &&
    `
    width: 16px;
    height: 12px;
    flex: 0 0 16px;
  `};
`
