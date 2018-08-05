import styled from 'styled-components'

export default styled.button`
  display: block;
  padding: 0;
  outline: 0;
  border: 0;
  background: none;
  font-size: 0;
  cursor: ${props => (props.disabled ? 'not-allowed' : 'pointer')};
  border: 1px solid #d7d7d7;
  border-radius: 2px;
`
