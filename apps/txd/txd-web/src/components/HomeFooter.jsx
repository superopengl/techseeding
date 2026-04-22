import React from 'react';
import { Layout, Row, Col } from 'antd';
import styled from 'styled-components';
import { useSearchParams } from 'react-router-dom';
import { HomeOutlined } from '@ant-design/icons';

const { Footer } = Layout;

const FooterStyled = styled(Footer)`
width: 100%;
text-align: center;
font-size: 0.7rem;
color: rgba(255,255,255,0.5);
background-color: #013a8c;
padding-left: 0;
padding-right: 0;
padding-top: 0;
a {
  color: rgba(255,255,255,0.5);

  &:hover {
    color: white;
    text-decoration: underline;
  }
}
`;

function HomeFooter() {
  const [searchParams] = useSearchParams();
  const wechat_app_ver = searchParams.get('wechat_app_ver');
  const gitCommitHash = import.meta.env.VITE_GIT_HASH || 'dev';
  const versionInfo = `Version: ${gitCommitHash}${wechat_app_ver ? ` / WeChat Mini Program Version: ${wechat_app_ver}` : ''}`;

  return (
    <FooterStyled>
      <section id="about">
        <Row gutter={[10, 2]}>
          <Col span={24}>&copy;{new Date().getFullYear()} Techseeding PTY LTD. All rights reserved.</Col>
          <Col span={24}>
            <HomeOutlined style={{ marginRight: 8 }} /><a href="https://maps.google.com/?q=Unit 101, 11 Spring St., Chatswood, NSW 2067" target="_blank" rel="noopener noreferrer">
              Unit 101, 11 Spring St., Chatswood, NSW 2067
            </a>
          </Col>
          <Col span={24}>ABN: 35631597450 / ACN: 631597450</Col>
          <Col span={24}>{versionInfo}</Col>
        </Row>
      </section>
    </FooterStyled>
  );
}

export default HomeFooter;
