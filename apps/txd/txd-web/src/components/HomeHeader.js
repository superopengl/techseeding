import React from 'react';
import styled from 'styled-components';
import { Layout, Menu, Drawer, Button } from 'antd';
import AnchorLink from 'react-anchor-link-smooth-scroll'
import MediaQuery from 'react-responsive'
import { MenuOutlined, HomeOutlined, PhoneOutlined, SmileOutlined, BellOutlined } from '@ant-design/icons';
import TechseedingLogo from './TechseedingLogo';

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
padding-left: 20px;
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


export class HomeHeader extends React.Component {
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

  render() {
    // const isSmallScreen = useMediaQuery({ query: '(max-device-width: 800px)' });

    return (
      <HeaderStyled>
        <HeaderLogo offset={headerHeight} href="#home">
          <TechseedingLogo></TechseedingLogo>
        </HeaderLogo>
        <MediaQuery minDeviceWidth={801}>
          <MenuContianer>
            <Menu mode="horizontal" style={{ border: 0 }}>
              <Menu.Item key="home"><AnchorLink offset={headerHeight} href="#home">Home</AnchorLink></Menu.Item>
              <Menu.Item key="events"><AnchorLink offset={headerHeight} href="#services">Services</AnchorLink></Menu.Item>
              <Menu.Item key="about_us"><AnchorLink offset={headerHeight} href="#about">About Us</AnchorLink></Menu.Item>
              <Menu.Item key="contact"><Button type="link" onClick={this.onClickContact}>Contact</Button></Menu.Item>
            </Menu>
          </MenuContianer>
        </MediaQuery>
        <MediaQuery maxDeviceWidth={800}>
          <Button type="link" style={{ backgroundColor: 'transparent', color: 'white' }} onClick={this.showDrawer}>
            <MenuOutlined />
          </Button>
          <Drawer
            // title={<div><MenuOutlined /> Menu</div>}
            placement="right"
            closable={false}
            onClose={this.onClose}
            visible={this.state.visible}
            width={200}
          >
            <Menu mode="vertical" style={{ border: 0 }} >
              <Menu.Item key="home"><HomeOutlined /> <AnchorLink offset={headerHeight} href="#home" onClick={this.onClose}>Home</AnchorLink></Menu.Item>
              <Menu.Item key="events"><BellOutlined /> <AnchorLink offset={headerHeight} href="#services" onClick={this.onClose}>Services</AnchorLink></Menu.Item>
              <Menu.Item key="about_us"><SmileOutlined /> <AnchorLink offset={headerHeight} href="#about" onClick={this.onClose}>About Us</AnchorLink></Menu.Item>
              <Menu.Item key="contact" onClick={this.onClickContact}><PhoneOutlined /> Contact</Menu.Item>
            </Menu>
          </Drawer>
        </MediaQuery>

      </HeaderStyled>
    )
  }
}

HomeHeader.propTypes = {};

HomeHeader.defaultProps = {};

export default HomeHeader;
