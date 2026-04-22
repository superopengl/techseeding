import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Layout, Row, Col, Typography, Button, Modal, Tag } from 'antd';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import HomeFeatureArea from 'components/homeAreas/HomeFeatureArea';
import { RiComputerLine } from "react-icons/ri";
import { GoDeviceMobile } from "react-icons/go";
import { BsStars } from "react-icons/bs";
import { AiOutlineWechat, AiOutlineMessage } from "react-icons/ai";
import { GiMeshNetwork, GiTeamIdea } from "react-icons/gi";
import ContactForm from 'components/ContactForm';
import { Trans } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const { Content } = Layout;

const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
`;

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

const PosterContainer = styled.div`
  width: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  padding-top: 60px;
  position: relative;
  overflow: hidden;

  .poster-patterns {
    background-image: url("images/logo-poster-pattern.svg");
    background-repeat: repeat;
    background-size: 100px;
    opacity: 0.04;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
  }
`;

const HeroTitle = styled.h1`
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-weight: 700;
  color: white;
  text-align: center;
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1.1;

  background: linear-gradient(135deg, #ffffff 0%, #a8c8ff 50%, #ffffff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeroSubtitle = styled.p`
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  margin: 0.75rem 0 0 0;
  letter-spacing: -0.01em;
  line-height: 1.4;
`;

const ContactButton = styled(Button)`
  && {
    width: 100%;
    max-width: 280px;
    height: 50px !important;
    margin-top: 2rem;
    border-radius: 25px;
    font-size: 16px;
    font-weight: 500;
    letter-spacing: -0.01em;
    background: rgba(255, 255, 255, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.35);
      color: white;
      transform: translateY(-1px);
      box-shadow: 0 8px 32px rgba(91, 156, 245, 0.15);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 2rem 1.5rem;
  height: 100%;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
`;

const CardIcon = styled.div`
  margin-bottom: 1.25rem;
  color: ${props => props.$color || '#5b9cf5'};
  opacity: 0.85;
  transition: all 0.4s ease;

  ${GlassCard}:hover & {
    opacity: 1;
    animation: ${subtleFloat} 3s ease-in-out infinite;
  }
`;

const CardTitle = styled.h3`
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-weight: 600;
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.92);
  margin: 0 0 0.75rem 0;
  letter-spacing: -0.02em;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
  line-height: 1.6;
  margin: 0;
`;

const StyledTag = styled(Tag)`
  && {
    border-radius: 999px;
    margin: 3px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.55);
    font-size: 0.75rem;
    padding: 2px 10px;
  }
`;

const AffixContactButton = styled(Button)`
  && {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: rgba(255, 255, 255, 0.8);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border-radius: 16px;
    transition: all 0.3s ease;
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 10;

    &:hover, &:focus, &:active {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.25);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(91, 156, 245, 0.2);
    }
  }
`;

const ServicesSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 1.5rem;
`;

const SectionLabel = styled.p`
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5b9cf5;
  margin: 0 0 0.5rem 0;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-weight: 700;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.92);
  margin: 0 0 3rem 0;
  letter-spacing: -0.03em;
`;

const tileSpanProps = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 8,
  xxl: 8,
};

const iconSize = 48;

const tileData = [
  {
    title: <Trans i18nKey="feature.title.ai" />,
    tags: [
      <Trans i18nKey="tag.ai_chatbot" />,
      <Trans i18nKey="tag.ai_automation" />,
      <Trans i18nKey="tag.ai_integration" />,
    ],
    content: <Trans i18nKey="feature.description.ai" />,
    icon: <BsStars size={iconSize} />,
    color: '#b68df0',
  },
  {
    title: <Trans i18nKey="feature.title.website" />,
    tags: [
      <Trans i18nKey="tag.portal" />,
      <Trans i18nKey="tag.webapp" />,
      <Trans i18nKey="tag.custom_design" />,
    ],
    content: <Trans i18nKey="feature.description.website" />,
    icon: <RiComputerLine size={iconSize} />,
    color: '#5b9cf5',
  },
  {
    title: <Trans i18nKey="feature.title.mobile" />,
    tags: [
      <Trans i18nKey="tag.app_dev" />,
      <Trans i18nKey="tag.mobile_api" />,
      <Trans i18nKey="tag.hosting" />,
    ],
    content: <Trans i18nKey="feature.description.mobile" />,
    icon: <GoDeviceMobile size={iconSize} />,
    color: '#e87eac',
  },
  {
    title: <Trans i18nKey="feature.title.wechat" />,
    tags: [
      <Trans i18nKey="tag.wechat_mini" />,
      <Trans i18nKey="tag.wechat_public" />,
      <Trans i18nKey="tag.wechat_api" />,
    ],
    content: <Trans i18nKey="feature.description.wechat" />,
    icon: <AiOutlineWechat size={iconSize} />,
    color: '#5dd894',
  },
  {
    title: <Trans i18nKey="feature.title.digitizing" />,
    tags: [
      <Trans i18nKey="tag.free_quote" />,
      <Trans i18nKey="tag.custom_solution" />,
      <Trans i18nKey="tag.e_commerce" />,
    ],
    content: <Trans i18nKey="feature.description.digitizing" />,
    icon: <GiMeshNetwork size={iconSize} />,
    color: '#f0c75e',
  },
  {
    title: <Trans i18nKey="feature.title.consulting" />,
    tags: [
      <Trans i18nKey="tag.full_stack" />,
      <Trans i18nKey="tag.architecture" />,
      <Trans i18nKey="tag.ba" />,
    ],
    content: <Trans i18nKey="feature.description.consulting" />,
    icon: <GiTeamIdea size={iconSize} />,
    color: '#5ed8d0',
  },
];

function useWindowSize() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
}

function HomePage() {
  const [modalVisible, setModalVisible] = useState(false);
  const contactFormRef = useRef(null);
  const windowWidth = useWindowSize();
  const [searchParams] = useSearchParams();

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

  const posterHeight = windowWidth < 576 ? 380 :
    windowWidth < 992 ? 440 : 520;

  const catchPhraseSize = windowWidth < 576 ? 30 :
    windowWidth < 992 ? 40 : 52;

  const origin = searchParams.get('origin');
  const shouldShowContact = true || origin !== 'wechat-app';

  return (
    <LayoutStyled>
      <Modal
        title={<div style={{ fontSize: '1rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
          <Trans i18nKey="contact.title" />
        </div>}
        open={modalVisible}
        destroyOnHidden={true}
        maskClosable={true}
        onOk={handleContactCancel}
        onCancel={handleContactCancel}
        footer={null}
        centered={true}
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(0, 0, 0, 0.4)' },
          content: { backdropFilter: 'blur(40px)', background: 'rgba(20, 30, 60, 0.75)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20 },
        }}
      >
        <ContactForm ref={contactFormRef} onDone={handleContactCancel} />
      </Modal>
      <HomeHeader onClickContact={openContactForm} />
      <ContentStyled>
        <section id="home">
          <PosterContainer style={{ height: posterHeight }}>
            <div className="poster-patterns" />
            <HeroTitle style={{ fontSize: catchPhraseSize }}>
              <Trans i18nKey="home.slogan" />
            </HeroTitle>
            <HeroSubtitle style={{ fontSize: Math.max(catchPhraseSize * 0.38, 14), maxWidth: 600 }}>
              <Trans i18nKey="home.catch_phrase" />
            </HeroSubtitle>
            {shouldShowContact && (
              <ContactButton type="default" shape="round" size="large" onClick={openContactForm}>
                <Trans i18nKey="button.contact_us" />
              </ContactButton>
            )}
          </PosterContainer>
        </section>
        <section id="services">
          <ServicesSection>
            <SectionLabel><Trans i18nKey="header.services" /></SectionLabel>
            <SectionTitle><Trans i18nKey="feature.title.website" /> &amp; more</SectionTitle>
            <Row gutter={[20, 20]}>
              {tileData.map((t, i) => (
                <Col key={i} {...tileSpanProps}>
                  <GlassCard>
                    <CardIcon $color={t.color}>{t.icon}</CardIcon>
                    <CardTitle>{t.title}</CardTitle>
                    {t.tags && t.tags.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {t.tags.map((tag, j) => <StyledTag key={j}>{tag}</StyledTag>)}
                      </div>
                    )}
                    <CardDescription>{t.content}</CardDescription>
                  </GlassCard>
                </Col>
              ))}
            </Row>
          </ServicesSection>
        </section>
        <section id="about_us">
          <HomeFeatureArea />
        </section>
      </ContentStyled>
      <HomeFooter />
      {shouldShowContact && (
        <AffixContactButton shape="default" size="large" onClick={openContactForm}>
          <AiOutlineMessage size={24} />
        </AffixContactButton>
      )}
    </LayoutStyled>
  );
}

export default HomePage;
