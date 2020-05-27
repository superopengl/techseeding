import React from 'react';

import styled from 'styled-components';
import HomeMessageArea from 'components/HomeMessageArea/HomeMessageArea';

// import 'App.css';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import { UserOutlined, UserAddOutlined, SmileOutlined } from '@ant-design/icons';
import { Carousel } from 'antd';
import HomeHeader from 'components/HomeHeader/HomeHeader';
import HomeFooter from 'components/HomeFooter/HomeFooter';
import HomeRowArea from 'components/HomeRowArea/HomeRowArea';
import HomeCarouselArea from 'components/HomeCarouselArea/HomeCarouselArea';
import HomeFeatureArea from 'components/HomeFeatureArea/HomeFeatureArea';
import HomeEventArea from 'components/HomeEventArea/HomeEventArea';
import HomeAboutArea from 'components/HomeAboutArea/HomeAboutArea';
const { Header, Content, Footer } = Layout;
const { Meta } = Card;
const { Option } = Select;

const LayoutStyled = styled(Layout)`
  margin: 0 auto 0 auto;
  background-color: #ffffff;
  text-align: 'center'; 
`;

const ContentStyled = styled(Content)`
  margin: 64px auto 0 auto;
  width: 100%;
`;

const HomePage = () => (
  <LayoutStyled>
    <HomeHeader></HomeHeader>
    {/* <BarStyled></BarStyled> */}
    <ContentStyled>
      <section id="home"><HomeCarouselArea></HomeCarouselArea></section>
      <section id="business"><HomeEventArea title="Top Business" bgColor="#ffffff" row={1}></HomeEventArea></section>
      <section id="business"><HomeEventArea title="New Business" bgColor="#f5f5f5" row={1}></HomeEventArea></section>
      <section id="business"><HomeEventArea title="Restaurant" bgColor="#ffffff" row={1}></HomeEventArea></section>
      <section id="business"><HomeEventArea title="Life" bgColor="#f5f5f5" row={1}></HomeEventArea></section>
      <section id="business"><HomeEventArea title="Auto" bgColor="#ffffff" row={1}></HomeEventArea></section>
      <section id="events"><HomeEventArea title="Upcoming Events" bgColor="#f5f5f5" row={1}></HomeEventArea></section>
      <section id="gallery"><HomeEventArea title="Gallery" bgColor="#ffffff" row={2}></HomeEventArea></section>
      {/* <section id="about"><HomeAboutArea bgColor="#ffffff" row={2}></HomeAboutArea></section> */}
      {/* <section id="aboutus"><HomeFeatureArea  bgColor="#f5f5f5"></HomeFeatureArea></section> */}
      {/* <HomeMessageArea></HomeMessageArea> */}
    </ContentStyled>
    <HomeFooter></HomeFooter>
  </LayoutStyled>
);

HomePage.propTypes = {};

HomePage.defaultProps = {};

export default HomePage;
