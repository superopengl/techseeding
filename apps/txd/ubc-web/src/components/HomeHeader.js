import React from 'react';
import styled from 'styled-components';
import { Layout, Menu, Drawer, Button } from 'antd';
import AnchorLink from 'react-anchor-link-smooth-scroll'
import MediaQuery from 'react-responsive'
import { useMediaQuery } from 'react-responsive'
import { MenuOutlined, HomeOutlined, PhoneOutlined, SmileOutlined, PictureOutlined, BellOutlined } from '@ant-design/icons';

const { Header } = Layout;
const HeaderStyled = styled(Header)`
position: fixed;
z-index: 1;
width: 100%;
// background-color: rgba(255,255,255,0.8);
background-color: rgba(255,255,255);
display: flex;
white-space: nowrap;
border: 0;
justify-content: space-between;
border-bottom: 1px solid #f0f0f0;
align-items: center;
box-shadow: 0px 2px 8px #888888;
padding-left: 20px;
padding-right: 20px;

`;

const MenuContianer = styled.div`
float: right;
// border: 0;
margin-bottom: 2px;
`;

const SiteLogo = styled.div`
height: 64px;
width: 120px;
background-image: url("images/logo-full.png");
background-size: contain;
background-repeat: no-repeat;
background-position: center;
display: inline-block;
`;

const PartnerLogo = styled.div`
width: 40px;
height: 40px;
background-image: url("images/partner.jpg");
background-size: contain;
background-repeat: no-repeat;
background-position: center;
display: inline-block;
margin-left: 0.5rem;
`

const PartnerWithText = styled.div`
display: inline-block;
font-size: 0.8rem;
color: #173875;
position: relative;
top: -6px;
`
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

  render() {
    // const isSmallScreen = useMediaQuery({ query: '(max-device-width: 800px)' });

    return (
      <HeaderStyled>
        <HeaderLogo offset={headerHeight} href="#home">
          <SiteLogo></SiteLogo><PartnerWithText>partner with</PartnerWithText><PartnerLogo></PartnerLogo>
        </HeaderLogo>


        {/* <ChLogName>商家联盟</ChLogName> */}
        {/* <img src="logo.jpg" alt="logo" style={{ marginBottom: 2 }}></img> */}
        {/* <Search
      placeholder="input search text"
      enterButton
      // size="large"
      suffix={<AudioOutlined
        style={{
          fontSize: 16,
          color: '#1890ff',
        }}
      />}
      style={{ marginLeft: '4rem', marginRight: '4rem' }}
      onSearch={value => console.log(value)}
    /> */}
        <MediaQuery minDeviceWidth={801}>
          <MenuContianer>
            <Menu mode="horizontal" style={{ border: 0 }}>
              {/* <Menu.Item key="services">Services</Menu.Item> */}
              {/* <Menu.Item key="produces">Products</Menu.Item> */}
              <Menu.Item key="home"><AnchorLink offset={headerHeight} href="#home">Home</AnchorLink></Menu.Item>
              <Menu.Item key="events"><AnchorLink offset={headerHeight} href="#events">Events</AnchorLink></Menu.Item>
              <Menu.Item key="gallery"><AnchorLink offset={headerHeight} href="#gallery">Gallery</AnchorLink></Menu.Item>
              <Menu.Item key="about_us"><AnchorLink offset={headerHeight} href="#about">About Us</AnchorLink></Menu.Item>
              <Menu.Item key="contact"><AnchorLink offset={headerHeight} href="#about">Contact</AnchorLink></Menu.Item>
              {/* <Menu.Item key="log_in"><UserOutlined />Login / Register</Menu.Item> */}
            </Menu>
          </MenuContianer>
        </MediaQuery>
        <MediaQuery maxDeviceWidth={800}>
          <Button type="default" onClick={this.showDrawer}>
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
              {/* <Menu.Item key="services">Services</Menu.Item> */}
              {/* <Menu.Item key="produces">Products</Menu.Item> */}
              <Menu.Item key="home"><HomeOutlined /> <AnchorLink offset={headerHeight} href="#home" onClick={this.onClose}>Home</AnchorLink></Menu.Item>
              <Menu.Item key="events"><BellOutlined /> <AnchorLink offset={headerHeight} href="#events" onClick={this.onClose}>Events</AnchorLink></Menu.Item>
              <Menu.Item key="gallery"><PictureOutlined /> <AnchorLink offset={headerHeight} href="#gallery" onClick={this.onClose}>Gallery</AnchorLink></Menu.Item>
              <Menu.Item key="about_us"><SmileOutlined /> <AnchorLink offset={headerHeight} href="#about" onClick={this.onClose}>About Us</AnchorLink></Menu.Item>
              <Menu.Item key="contact"><PhoneOutlined /> <AnchorLink offset={headerHeight} href="#about" onClick={this.onClose}>Contact</AnchorLink></Menu.Item>
              {/* <Menu.Item key="log_in"><UserOutlined />Login / Register</Menu.Item> */}
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
