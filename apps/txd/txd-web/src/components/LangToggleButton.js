import React from 'react';
import { withRouter } from 'react-router-dom'
import styled from 'styled-components';
const Contianer = styled.div`
color: rgba(255,255,255,0.7);
display: flex;

&:hover {
  color: white;
}
`;

class LangToggleButton extends React.Component {

  render() {
    return <Contianer onClick={this.props.onClick}>
    English / 简体中文
    </Contianer>
  }
}

export default withRouter(LangToggleButton);

