import React from 'react';
import styled from 'styled-components';
import { Layout } from 'antd';
import { Trans } from 'react-i18next';
import HomeHeader, { headerHeight } from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';

const LayoutStyled = styled(Layout)`
  background: var(--paper);
  min-height: 100vh;
`;

const PageWrap = styled.main`
  max-width: 46rem;
  margin: 0 auto;
  padding: calc(${headerHeight}px + 4rem) var(--gutter) 6rem;
  line-height: 1.65;
`;

const PageTitle = styled.h1`
  margin: 0;
  font-size: clamp(2.25rem, 5vw, 3.25rem);
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1.05;
  color: var(--cobalt);
`;

const LastUpdated = styled.p`
  margin: 0.75rem 0 3rem;
  color: var(--slate);
`;

const SectionTitle = styled.h2`
  margin: 2.5rem 0 0.6rem;
  font-size: 1.3rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--ink);
`;

const Paragraph = styled.p`
  margin: 0 0 1rem;
  color: #34405a;
`;

function PrivacyPolicyPage() {
  return (
    <LayoutStyled>
      <HomeHeader />
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
      <HomeFooter />
    </LayoutStyled>
  );
}

export default PrivacyPolicyPage;
