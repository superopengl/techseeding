import React from 'react';
import { Layout, Row, Col, Divider } from 'antd';
import styled from 'styled-components';
import GitInfo from 'react-git-info/macro';
const { Footer } = Layout;
const gitInfo = GitInfo();
const gitCommitHash = gitInfo.commit.shortHash;

const FooterStyled = styled(Footer)`
width: 100%;
text-align: center;
font-size: 0.9rem;
color: #f0f0f0;
background-color: #22075e;
padding-left: 0;
padding-right: 0;
padding-top: 0;
a {
  color: #f0f0f0;

  &:hover {
    color: white;
    text-decoration: underline;
  }
}
`;


const HomeFooter = () => (
  <FooterStyled>
    <section id="about">
      {/* <Row>
        <Col span={8}>
          <H3>About Us</H3>
          <p>
            We are a team of tech savveis with 15+ year experience in software industry. We have plenty of successful experiences in website, web application, mobile apps, wechat apps, database design and architecture design. Our tech stacks cover majority of the popular ones including Python, Nodejs, C#, Reactjs, Angular, JavaScript, TypeScript, MongoDB, PostgreSQL, SQL Server, MySQL, Docker, AWS and Azure.
        </p>
        </Col>
        <Col span={8}>
          <H3>Contact</H3>
          <div style={{ textAlign: 'left', paddingLeft: '4rem' }}>
            <p>
              <MailOutlined /> Email      :  <a href="mailto:contact@techseeding.com.au">contact@techseeding.com.au</a>
        </p>
            <p>
              <PhoneOutlined /> Phone     :  0405581228
        </p>
            <p>
              <WechatOutlined /> WeChat   :  superopengl
        </p>
        <p>
          <img src="images/wechat_qr.jpg" alt="wechat account: superopengl" width={100} height={100}/>
        </p>
          </div>
        </Col>
        <Col span={8}>
          <H3>Disclaimer</H3>
          <p>
            A disclaimer is a notice which is placed on your website in an effort to limit your liability for the outcome of the use of your site. Even if you haven't thought much about them previously, you have certainly seen disclaimers all over the web. Nearly every website has one in place, and you should as well.
        </p>
        </Col>
      </Row>*/}
      <Divider></Divider>
      <Row>
        <Col span={24}> ©2020 Techseeding PTY LTD. All rights reserved. Version {gitCommitHash}</Col>
      </Row>
    </section>
  </FooterStyled>
);

HomeFooter.propTypes = {};

HomeFooter.defaultProps = {};

export default HomeFooter;
