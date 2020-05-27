import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import { UserOutlined, UserAddOutlined, SmileOutlined, AudioOutlined } from '@ant-design/icons';
import PoweredByLogo from '../PoweredByLogo/PoweredByLogo';
import AnchorLink from 'react-anchor-link-smooth-scroll'
const { Header, Content, Footer } = Layout;
const { Search } = Input;

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
`;

const MenuContianer = styled.div`
float: right;
// border: 0;
margin-bottom: 2px;
`;

const SiteLogoName = styled.span`
font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
font-size: 3rem;
color: #54b8d5;
`;


const headerHeight = 64;

const HomeHeader = () => (
  <HeaderStyled>
    <SiteLogoName>UBC</SiteLogoName>
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
  </HeaderStyled>
);

HomeHeader.propTypes = {};

HomeHeader.defaultProps = {};

export default HomeHeader;
