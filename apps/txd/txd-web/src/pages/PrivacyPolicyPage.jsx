import React from 'react';
import styled from 'styled-components';
import { Layout } from 'antd';
import { Trans } from 'react-i18next';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';

const { Content } = Layout;

const LayoutStyled = styled(Layout)`
  margin: 0 auto;
  background: transparent;
  overflow-x: hidden;
  min-height: 100vh;
`;

const ContentStyled = styled(Content)`
  margin: 0 auto;
  width: 100%;
`;

const PageWrap = styled.section`
  max-width: 820px;
  margin: 0 auto;
  padding: 120px 1.5rem 80px;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.75;
  font-size: 1rem;
  letter-spacing: -0.01em;
`;

const PageTitle = styled.h1`
  font-weight: 700;
  font-size: 2.4rem;
  letter-spacing: -0.04em;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(160deg, #ffffff 0%, #94bfff 50%, #c4b5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const LastUpdated = styled.p`
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.85rem;
  margin: 0 0 2.5rem 0;
  font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
  letter-spacing: 0.02em;
`;

const SectionTitle = styled.h2`
  font-weight: 600;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.92);
  margin: 2rem 0 0.75rem 0;
  letter-spacing: -0.02em;
`;

const Paragraph = styled.p`
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.7);
`;

function PrivacyPolicyPage() {
  return (
    <LayoutStyled>
      <HomeHeader />
      <ContentStyled>
        <PageWrap>
          <PageTitle><Trans i18nKey="privacy.title" /></PageTitle>
          <LastUpdated><Trans i18nKey="privacy.last_updated" /></LastUpdated>

          <SectionTitle><Trans i18nKey="privacy.section.overview.title" /></SectionTitle>
          <Paragraph><Trans i18nKey="privacy.section.overview.content" /></Paragraph>

          <SectionTitle><Trans i18nKey="privacy.section.no_collection.title" /></SectionTitle>
          <Paragraph><Trans i18nKey="privacy.section.no_collection.content" /></Paragraph>

          <SectionTitle><Trans i18nKey="privacy.section.product_specific.title" /></SectionTitle>
          <Paragraph><Trans i18nKey="privacy.section.product_specific.content" /></Paragraph>

          <SectionTitle><Trans i18nKey="privacy.section.changes.title" /></SectionTitle>
          <Paragraph><Trans i18nKey="privacy.section.changes.content" /></Paragraph>

          <SectionTitle><Trans i18nKey="privacy.section.contact.title" /></SectionTitle>
          <Paragraph><Trans i18nKey="privacy.section.contact.content" /></Paragraph>
        </PageWrap>
      </ContentStyled>
      <HomeFooter />
    </LayoutStyled>
  );
}

export default PrivacyPolicyPage;
