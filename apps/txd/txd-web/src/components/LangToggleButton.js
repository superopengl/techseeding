import React from 'react';
import { withRouter } from 'react-router-dom'
import * as queryString from 'query-string';
import styled from 'styled-components';
import i18n from "i18next";


const LangIconImg = styled.img`
  width: 32px;
  height: 32px;
  cursor: pointer;
`;

class LangToggleButton extends React.Component {

  render() {
    const { lng } = queryString.parse(this.props.location.search);
    const lang = lng || 'en';
    const auZIndex = lang === 'en' ? 1 : -1;
    const auScale = lang === 'en' ? 1 : 0.8;
    const chZIndex = lang === 'zh' ? 1 : -1;
    const chScale = lang === 'zh' ? 1 : 0.8;

    return <div onClick={this.props.onClick}>
    <LangIconImg src="images/flag-au.png" alt="English" width="40" height="auto" style={{zIndex: auZIndex, transform: `scale(${auScale})`}}/>
    <LangIconImg src="images/flag-ch.png" alt="Chinese" width="40" height="auto" style={{zIndex: chZIndex, transform: `scale(${chScale})`, position: 'relative', left: '-10px'}}/>
    </div>
  }
}

export default withRouter(LangToggleButton);

