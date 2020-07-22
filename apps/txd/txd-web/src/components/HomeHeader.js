import React from 'react';
import styled from 'styled-components';
import { Layout, Menu, Drawer, Button } from 'antd';
import AnchorLink from 'react-anchor-link-smooth-scroll'
import MediaQuery from 'react-responsive'
import { MenuOutlined } from '@ant-design/icons';
import { AiFillMessage } from "react-icons/ai";
import { BsPeopleFill } from "react-icons/bs";
import { GrLanguage } from "react-icons/gr";
import { FaHome, FaLanguage } from "react-icons/fa";
import { MdRoomService, MdLanguage } from "react-icons/md";
import * as queryString from 'query-string';
import { withRouter } from 'react-router-dom'
import { Trans } from 'react-i18next';
import LangToggleButton from './LangToggleButton';

const { Header } = Layout;
const HeaderStyled = styled(Header)`
position: fixed;
z-index: 1;
width: 100%;
background-color: rgba(0,0,0,0.6);
// background-color: rgba(255,255,255);
display: flex;
white-space: nowrap;
border: 0;
justify-content: space-between;
// border-bottom: 1px solid #f0f0f0;
align-items: center;
// box-shadow: 0px 2px 8px #888888;
padding-left: 0px;
padding-right: 20px;
color: white;

& .ant-menu {
  background-color: transparent;

  & .ant-menu-item {
    top: 0;

    & a,button {
      color: rgba(255,255,255,0.7);
      padding-left: 0;
      padding-right: 0;

      &:hover {
        color: #ffffff;
      }
    }
  }

  & .ant-menu-item:hover {
    color: #ffffff;
    border-color: #ffffff;
  }

  .ant-menu-item-selected,.ant-menu-item-selected {
    border-color: transparent;
  }
}

`;

const MenuContianer = styled.div`
float: right;
// border: 0;
margin-bottom: 2px;
`;

const headerHeight = 64;

const HeaderLogo = styled(AnchorLink)`
diaplay: fex;
height: ${headerHeight}px;
`

const StyledDrawer = styled(Drawer)`
color: #22075e;

a {
  color: #22075e !important;
}

.ant-menu-item, .ant-menu-item:active, .ant-menu-item-selected {
  background-color: white !important;
  color: #22075e !important;
}

svg {
  position: relative;
  top: 2px;
  margin-right: 1rem;
  color: #22075e;
}
`;

const LogoImg = styled.img`
  height: ${headerHeight - 16}px;
  width: auto;
  margin-left: 8px;
`;

class HomeHeaderRaw extends React.Component {
  state = {
    visible: false
  }

  showDrawer = () => {
    this.setState({
      visible: true,
    });
  };

  onClose = () => {
    this.setState({
      visible: false,
    });
  };

  onClickContact = () => {
    this.setState({
      visible: false,
    }, () => this.props.onClickContact());
  }

  toggleLanguage = () => {
    const { lng } = queryString.parse(this.props.location.search);
    console.log(lng);
    const lang = lng === 'zh' ? 'en' : 'zh';

    // i18n.changeLanguage(lang);
    this.props.history.push({
      search: `?lng=${lang}`
    });
    window.location.reload();
  }

  render() {
    // const isSmallScreen = useMediaQuery({ query: '(max-device-width: 800px)' });

    const { origin } = queryString.parse(this.props.location.search);
    const shouldShowContact = origin !== 'wechat-app';

    return (
      <HeaderStyled>
        <HeaderLogo offset={headerHeight} href="#home">
          {/* <TechseedingLogo></TechseedingLogo> */}
          <LogoImg src="logo-bw.png" alt="TECHSEEDING LOGO"></LogoImg>
        </HeaderLogo>
        <MediaQuery minDeviceWidth={801}>
          <MenuContianer>
            <Menu mode="horizontal" style={{ border: 0 }}>

              <Menu.Item key="home">
                <AnchorLink offset={headerHeight} href="#home">
                  <Trans i18nKey="header.home" />
                </AnchorLink>
              </Menu.Item>
              <Menu.Item key="events">
                <AnchorLink offset={headerHeight} href="#services">
                  <Trans i18nKey="header.services" />
                </AnchorLink>
              </Menu.Item>
              <Menu.Item key="about_us">
                <AnchorLink offset={headerHeight} href="#about_us">
                  <Trans i18nKey="header.about_us" />
                </AnchorLink>
              </Menu.Item>
              {shouldShowContact && <Menu.Item key="contact">
                <Button type="link" onClick={this.onClickContact}>
                  <Trans i18nKey="header.contact" />
                </Button></Menu.Item>}
              <Menu.Item key="lng">
                <LangToggleButton onClick={this.toggleLanguage} />
              </Menu.Item>
            </Menu>
          </MenuContianer>
        </MediaQuery>
        <MediaQuery maxDeviceWidth={800}>
          <Button type="link" style={{ backgroundColor: 'transparent', color: 'white' }} onClick={this.showDrawer}>
            <MenuOutlined />
          </Button>
          <StyledDrawer
            // title={<div><MenuOutlined /> Menu</div>}
            placement="right"
            closable={false}
            onClose={this.onClose}
            visible={this.state.visible}
            width={240}
          >
            <Menu mode="vertical" style={{ border: 0 }} >
              <Menu.Item key="home"><FaHome /> <AnchorLink offset={headerHeight} href="#home" onClick={this.onClose}>
                <Trans i18nKey="header.home" />
              </AnchorLink></Menu.Item>
              <Menu.Item key="events"><MdRoomService /> <AnchorLink offset={headerHeight} href="#services" onClick={this.onClose}>
                <Trans i18nKey="header.services" />
              </AnchorLink></Menu.Item>
              <Menu.Item key="about_us"><BsPeopleFill /> <AnchorLink offset={headerHeight} href="#about_us" onClick={this.onClose}>
                <Trans i18nKey="header.about_us" />
              </AnchorLink></Menu.Item>
              {shouldShowContact && <Menu.Item key="contact" onClick={this.onClickContact}><AiFillMessage /> <Trans i18nKey="header.contact" /></Menu.Item>}
              <Menu.Item key="lang" onClick={this.toggleLanguage}><MdLanguage /> EN / 中文</Menu.Item>
            </Menu>
          </StyledDrawer>
        </MediaQuery>

      </HeaderStyled>
    )
  }
}

export const HomeHeader = withRouter(HomeHeaderRaw);

HomeHeader.propTypes = {};

HomeHeader.defaultProps = {};

export default HomeHeader;
