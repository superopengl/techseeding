import React from 'react';
// import logo from './logo.svg';
import 'antd/dist/antd.less';
import styled from 'styled-components';
import HomeMessageArea from './components/HomeMessageArea/HomeMessageArea';

// import './App.css';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import { UserOutlined, UserAddOutlined, SmileOutlined } from '@ant-design/icons';
import { Carousel } from 'antd';
import HomeHeader from './components/HomeHeader/HomeHeader';
import HomeFooter from './components/HomeFooter/HomeFooter';
import HomeRowArea from './components/HomeRowArea/HomeRowArea';
import HomeCarouselArea from './components/HomeCarouselArea/HomeCarouselArea';
import HomeFeatureArea from './components/HomeFeatureArea/HomeFeatureArea';
import HomeEventArea from './components/HomeEventArea/HomeEventArea';
const { Header, Content, Footer } = Layout;
const { Meta } = Card;
const { Option } = Select;

const LayoutStyled = styled(Layout)`
  margin: 0 auto 0 auto;
  background-color: #ffffff;
  text-align: 'center'; 
`;

const ContentStyled = styled(Content)`
  margin: 64px auto 68px auto;
  width: 100%;
`;

const BarStyled = styled.div`
  width: 100%;
  height: 4px;
  background-color: #00202e;
  position: fixed;
  top: 0;
  z-index: 1000;
`;

function App() {
  return (
    <LayoutStyled>
      <HomeHeader></HomeHeader>
      {/* <BarStyled></BarStyled> */}
      <ContentStyled>
        <HomeCarouselArea></HomeCarouselArea>
        <HomeFeatureArea></HomeFeatureArea>
        <HomeEventArea title="Top Business" bgColor="#f5f5f5" row={1}></HomeEventArea>
        <HomeEventArea title="Restaurants" bgColor="#ffffff" row={1}></HomeEventArea>
        <HomeEventArea title="Auto" bgColor="#f5f5f5" row={1}></HomeEventArea>
        <HomeEventArea title="Life" bgColor="#ffffff" row={2}></HomeEventArea>
        <HomeEventArea title="Upcoming Events" bgColor="#f5f5f5" row={1}></HomeEventArea>
        <HomeMessageArea></HomeMessageArea>
      </ContentStyled>
      <HomeFooter></HomeFooter>
    </LayoutStyled>
  );
}

export default App;
