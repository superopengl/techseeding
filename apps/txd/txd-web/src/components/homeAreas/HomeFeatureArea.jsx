import React from 'react';
import styled from 'styled-components';
import { MailOutlined, PhoneOutlined, WechatOutlined } from '@ant-design/icons';
import { Trans } from 'react-i18next';
import { MdOpenInNew } from "react-icons/md";
import { CopyToClipboardButton } from '../CopyToClipboardButton';
import { Row, Col } from 'antd';

const Container = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 1.5rem 40px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: 10%;
    width: 500px;
    height: 350px;
    background: radial-gradient(ellipse, rgba(6, 182, 212, 0.05) 0%, transparent 70%);
    pointer-events: none;
    z-index: -1;
  }
`;

const GlassInfoCard = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.75rem;
  height: 100%;
  position: relative;
  transition: border-color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const SubTitle = styled.h3`
  font-weight: 600;
  font-size: 1.05rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
`;

const BodyText = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.825rem;
  line-height: 1.7;
`;

const ContactSection = styled.div`
  p {
    margin: 0;
    padding: 5px 0;
    color: rgba(255, 255, 255, 0.48);
    font-size: 0.825rem;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  a {
    color: rgba(255, 255, 255, 0.6);
    transition: color 0.2s ease;

    &:hover {
      color: white;
      text-decoration: none;
    }
  }

  .anticon, svg {
    opacity: 0.4;
    font-size: 13px;
  }
`;

const SectionLabel = styled.p`
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  color: #818cf8;
  margin: 0 0 0.5rem 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-weight: 700;
  font-size: 2.2rem;
  color: rgba(255, 255, 255, 0.95);
  margin: 0 0 3rem 0;
  letter-spacing: -0.04em;
`;

const spanProps = {
  xs: 24,
  sm: 24,
  md: 24,
  lg: 8,
  xl: 8,
  xxl: 8,
};

function HomeFeatureArea() {
  return (
    <Container>
      <SectionLabel><Trans i18nKey="section.about" /></SectionLabel>
      <SectionTitle><Trans i18nKey="home.about_us" /></SectionTitle>
      <Row gutter={[16, 16]}>
        <Col {...spanProps}>
          <GlassInfoCard>
            <SubTitle><Trans i18nKey="home.about_us" /></SubTitle>
            <BodyText><Trans i18nKey="home.about_us.content" /></BodyText>
          </GlassInfoCard>
        </Col>
        <Col {...spanProps}>
          <GlassInfoCard>
            <SubTitle><Trans i18nKey="home.contact" /></SubTitle>
            <ContactSection>
              <p>
                <MdOpenInNew /> <Trans i18nKey="home.contact.website" />: <a target="blank" referrerPolicy="no-referrer" href="https://www.techseeding.com.au/">techseeding.com.au</a>
                <CopyToClipboardButton value="https://www.techseeding.com.au/" />
              </p>
              <p>
                <MailOutlined /> <Trans i18nKey="home.contact.email" />: <a href="mailto:mr.shaojun@gmail.com">mr.shaojun@gmail.com</a>
                <CopyToClipboardButton value="mr.shaojun@gmail.com" />
              </p>
              <p>
                <PhoneOutlined /> <Trans i18nKey="home.contact.phone" />: <a href="tel:+61405581228">+61 4 0558 1228</a>
                <CopyToClipboardButton value="+61405581228" />
              </p>
              <p>
                <WechatOutlined /> <Trans i18nKey="home.contact.wechat" />: <a href="weixin://dl/chat?superopengl">superopengl</a>
                <CopyToClipboardButton value="superopengl" />
              </p>
            </ContactSection>
          </GlassInfoCard>
        </Col>
        <Col {...spanProps}>
          <GlassInfoCard>
            <SubTitle><Trans i18nKey="home.why_us" /></SubTitle>
            <BodyText><Trans i18nKey="home.why_us.content" /></BodyText>
          </GlassInfoCard>
        </Col>
      </Row>
    </Container>
  );
}

export default HomeFeatureArea;
