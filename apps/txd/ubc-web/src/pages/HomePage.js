import React from 'react';

import styled from 'styled-components';

// import 'App.css';
import { Layout } from 'antd';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import HomeCarouselArea from 'components/homeAreas/HomeCarouselArea';
import HomeEventArea from 'components/homeAreas/HomeEventArea';
import HomeGalleryArea from 'components/homeAreas/HomeGalleryArea';
import HomeBusinessArea from 'components/homeAreas/HomeBusinessArea';
const { Content } = Layout;

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
      <section id="business"><HomeBusinessArea title="Top Business" bgColor="#ffffff" group="top" row={1}></HomeBusinessArea></section>
      <section id="business"><HomeBusinessArea title="New Business" bgColor="#f5f5f5" group="new" row={1}></HomeBusinessArea></section>
      <section id="business"><HomeBusinessArea title="Restaurant" bgColor="#ffffff" group="restaurant" row={1}></HomeBusinessArea></section>
      <section id="business"><HomeBusinessArea title="Life" bgColor="#f5f5f5" group="life" row={1}></HomeBusinessArea></section>
      <section id="business"><HomeBusinessArea title="Auto" bgColor="#ffffff" group="auto" row={1}></HomeBusinessArea></section>
      <section id="events"><HomeEventArea title="Upcoming Events" bgColor="#f5f5f5" row={1}></HomeEventArea></section>
      <section id="gallery"><HomeGalleryArea title="Gallery" bgColor="#ffffff" row={2}></HomeGalleryArea></section>
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
