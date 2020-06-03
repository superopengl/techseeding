import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button, Divider } from 'antd';
import styled from 'styled-components';
import { MailOutlined, PhoneOutlined, GlobalOutlined, WechatOutlined } from '@ant-design/icons';
import { TechseedingLogo } from "components/TechseedingLogo";
const { Header, Content, Footer } = Layout;


const FooterStyled = styled(Footer)`
width: 100%;
text-align: center;
font-size: 0.8rem;
color: #f0f0f0;
background-color: #173875;
`;

const H3 = styled.h3`
color: #f0f0f0;
`

const HomeFooter = () => (
  <FooterStyled>
    <section id="about">
      <Row>
        <Col span={8}>
          <H3>About Us</H3>
          <p>
            A disclaimer is a notice which is placed on your website in an effort to limit your liability for the outcome of the use of your site. Even if you haven't thought much about them previously, you have certainly seen disclaimers all over the web. Nearly every website has one in place, and you should as well.
        </p>
        </Col>
        <Col span={8}>
          <H3>Contact</H3>
          <div style={{ textAlign: 'left', paddingLeft: '4rem' }}>
            <p>
              <MailOutlined /> Email      :  abc@google.com
        </p>
            <p>
              <PhoneOutlined /> Phone     :  02012345678
        </p>
            <p>
              <WechatOutlined /> WeChat   :  helloWeChat
        </p>
            <p>
              <GlobalOutlined /> Address  :  456 Sydney Street, Sydney, NSW 2000
        </p>
          </div>
        </Col>
        <Col span={8}>
          <H3>Disclaimer</H3>
          <p>
            A disclaimer is a notice which is placed on your website in an effort to limit your liability for the outcome of the use of your site. Even if you haven't thought much about them previously, you have certainly seen disclaimers all over the web. Nearly every website has one in place, and you should as well.
        </p>
        </Col>
      </Row>
      <Divider></Divider>
      <Row>
        <Col span={24}> Copyright ©2020 UBC. Tech by TECHSEEDING PTY LTD. <TechseedingLogo /></Col>
      </Row>
    </section>
  </FooterStyled>
);

HomeFooter.propTypes = {};

HomeFooter.defaultProps = {};

export default HomeFooter;
