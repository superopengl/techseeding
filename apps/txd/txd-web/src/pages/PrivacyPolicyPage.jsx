import React, { useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Layout, Modal, Button } from 'antd';
import { Trans } from 'react-i18next';
import { AiOutlineMessage } from 'react-icons/ai';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import ContactForm from 'components/ContactForm';

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

const AffixContactButton = styled(Button)`
  && {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: rgba(255, 255, 255, 0.7);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    border-radius: 14px;
    transition: all 0.3s ease;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 10;

    &:hover, &:focus, &:active {
      background: rgba(99, 102, 241, 0.2);
      border-color: rgba(99, 102, 241, 0.4);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.25);
    }
  }
`;

function PrivacyPolicyPage() {
  const [modalVisible, setModalVisible] = useState(false);
  const contactFormRef = useRef(null);

  const resetContactForm = useCallback(() => {
    if (contactFormRef.current) {
      contactFormRef.current.reset();
    }
  }, []);

  const handleContactCancel = useCallback(() => {
    setModalVisible(false);
    resetContactForm();
  }, [resetContactForm]);

  const openContactForm = useCallback(() => {
    setModalVisible(true);
    setTimeout(() => {
      if (contactFormRef.current) {
        contactFormRef.current.focus();
      }
    }, 300);
  }, []);

  return (
    <LayoutStyled>
      <Modal
        title={<div style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
          <Trans i18nKey="contact.title" />
        </div>}
        open={modalVisible}
        destroyOnHidden={true}
        onOk={handleContactCancel}
        onCancel={handleContactCancel}
        footer={null}
        centered={true}
        closeIcon={<span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>&#x2715;</span>}
        styles={{
          mask: { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(0, 0, 0, 0.6)' },
          content: {
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            background: 'linear-gradient(170deg, rgba(20, 20, 45, 0.92) 0%, rgba(10, 10, 25, 0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            boxShadow: '0 32px 80px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255,255,255,0.1) inset',
            padding: '24px 28px',
          },
          header: {
            background: 'transparent',
            borderBottom: 'none',
            paddingBottom: 4,
          },
          body: {
            paddingTop: 8,
          },
        }}
      >
        <ContactForm ref={contactFormRef} onDone={handleContactCancel} />
      </Modal>
      <HomeHeader onClickContact={openContactForm} />
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
      <AffixContactButton shape="default" size="large" onClick={openContactForm}>
        <AiOutlineMessage size={22} />
      </AffixContactButton>
    </LayoutStyled>
  );
}

export default PrivacyPolicyPage;
