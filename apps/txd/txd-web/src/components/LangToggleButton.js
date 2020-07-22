import React from 'react';
import { withRouter } from 'react-router-dom'
import * as queryString from 'query-string';
import styled from 'styled-components';
import i18n from "i18next";


const LangIconImg = styled.img`
  width: 30px;
  height: 30px;
`;

class LangToggleButton extends React.Component {

  toggle = () => {
    const {lng} = queryString.parse(this.props.location.search);
    console.log(lng);
    const lang = lng === 'zh' ? 'en': 'zh';

    i18n.changeLanguage(lang);
  }

  render() {
    const { lng } = queryString.parse(this.props.location.search);
    const lang = lng || 'en';

    return <div onClick={this.toggle}>
    <LangIconImg src="images/flag-au.png" width="40" height="auto" style={{zIndex: -1}}/>
    <LangIconImg src="images/flag-ch.png" width="40" height="auto" style={{zIndex: 1, position: 'relative', left: '-10px'}}/>
    </div>
  }
}

export default withRouter(LangToggleButton);

