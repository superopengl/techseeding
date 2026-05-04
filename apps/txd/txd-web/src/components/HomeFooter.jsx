import React from 'react';
import { Layout, Row, Col } from 'antd';
import styled from 'styled-components';
import { useSearchParams, Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

const { Footer } = Layout;

const FooterStyled = styled(Footer)`
  width: 100%;
  text-align: center;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.25);
  background: transparent;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  padding: 2rem 1rem;
  letter-spacing: -0.01em;

  a {
    color: rgba(255, 255, 255, 0.3);
    transition: color 0.2s ease;

    &:hover {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
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
        <Row gutter={[10, 4]}>
          <Col span={24}>&copy;2019-{new Date().getFullYear()} Techseeding PTY LTD. All rights reserved.</Col>
          <Col span={24}>ABN: 35631597450 / ACN: 631597450</Col>
          <Col span={24}>
            <Link to="/privacy_policy"><Trans i18nKey="footer.privacy_policy" /></Link>
          </Col>
          <Col span={24} style={{ opacity: 0 }}>{versionInfo}</Col>
        </Row>
      </section>
    </FooterStyled>
  );
}

export default HomeFooter;
