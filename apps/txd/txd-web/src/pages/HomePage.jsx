import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Layout, Row, Col, Button, Modal, Tag } from 'antd';
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

const auroraShift = keyframes`
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  33% { transform: translate(30px, -20px) rotate(120deg) scale(1.1); }
  66% { transform: translate(-20px, 20px) rotate(240deg) scale(0.95); }
  100% { transform: translate(0, 0) rotate(360deg) scale(1); }
`;

const subtleFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
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

/* ─── Hero ─── */

const HeroSection = styled.section`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 1.5rem;
  padding-top: 80px;
`;

const AuroraBackground = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: 0;

  &::before, &::after {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.35;
    animation: ${auroraShift} 20s ease-in-out infinite;
  }

  &::before {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #3b82f6 0%, transparent 70%);
    top: -20%;
    left: -10%;
  }

  &::after {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #8b5cf6 0%, transparent 70%);
    bottom: -10%;
    right: -10%;
    animation-delay: -7s;
    animation-direction: reverse;
  }
`;

const AuroraOrb = styled.div`
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.2;
  background: radial-gradient(circle, #06b6d4 0%, transparent 70%);
  top: 30%;
  left: 50%;
  transform: translateX(-50%);
  animation: ${auroraShift} 25s ease-in-out infinite;
  animation-delay: -12s;
`;

const GridOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 50%, black 20%, transparent 70%);
  z-index: 0;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${fadeInUp} 1s cubic-bezier(0.16, 1, 0.3, 1) both;
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 0.02em;
  margin-bottom: 1.5rem;

  span {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #5dd894;
    box-shadow: 0 0 8px #5dd894;
  }
`;

const HeroTitle = styled.h1`
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-weight: 700;
  text-align: center;
  margin: 0;
  letter-spacing: -0.04em;
  line-height: 1.08;

  background: linear-gradient(160deg, #ffffff 0%, #94bfff 40%, #c4b5fd 60%, #ffffff 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const HeroSubtitle = styled.p`
  font-weight: 400;
  color: rgba(255, 255, 255, 0.45);
  text-align: center;
  margin: 1rem 0 0 0;
  letter-spacing: -0.01em;
  line-height: 1.5;
`;

const ContactButton = styled(Button)`
  && {
    width: 100%;
    max-width: 220px;
    height: 48px !important;
    margin-top: 2.5rem;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: none;
    color: white;
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 12px;
      padding: 1px;
      background: linear-gradient(135deg, rgba(255,255,255,0.3), transparent, rgba(255,255,255,0.1));
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
      -webkit-mask-composite: xor;
      pointer-events: none;
    }

    &:hover {
      background: linear-gradient(135deg, #4f8ff7, #9d6ff8);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(99, 102, 241, 0.4);
    }

    &:active {
      transform: translateY(0);
    }
  }
`;

/* ─── Service Cards ─── */

const GlassCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 1.75rem 1.5rem;
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
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at center, ${props => props.$glowColor || '#5b9cf5'}10 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
  }

  &:hover {
    border-color: ${props => props.$glowColor || '#5b9cf5'}40;
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 40px ${props => props.$glowColor || '#5b9cf5'}12;

    &::after {
      opacity: 1;
    }
  }
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  background: ${props => props.$color || '#5b9cf5'}15;
  color: ${props => props.$color || '#5b9cf5'};
  transition: all 0.4s ease;
  font-size: 24px;

  ${GlassCard}:hover & {
    background: ${props => props.$color || '#5b9cf5'}22;
    box-shadow: 0 0 24px ${props => props.$color || '#5b9cf5'}30;
  }
`;

const CardTitle = styled.h3`
  font-weight: 600;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.92);
  margin: 0 0 0.6rem 0;
  letter-spacing: -0.02em;
`;

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  line-height: 1.65;
  margin: 0;
`;

const StyledTag = styled(Tag)`
  && {
    border-radius: 6px;
    margin: 2px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
    letter-spacing: 0.01em;
    padding: 1px 8px;
  }
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

/* ─── Sections ─── */

const ServicesSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 1.5rem;
  position: relative;
`;

const SectionDivider = styled.div`
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  margin: 0 auto;
  max-width: 800px;
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
  margin: 0 0 3.5rem 0;
  letter-spacing: -0.04em;
`;

const tileSpanProps = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 8,
  xxl: 8,
};

const iconSize = 24;

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
    color: '#a78bfa',
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
    color: '#60a5fa',
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
    color: '#f472b6',
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
    color: '#34d399',
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
    color: '#fbbf24',
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
    color: '#2dd4bf',
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

  const posterHeight = windowWidth < 576 ? 420 :
    windowWidth < 992 ? 480 : 560;

  const catchPhraseSize = windowWidth < 576 ? 32 :
    windowWidth < 992 ? 44 : 56;

  const origin = searchParams.get('origin');
  const shouldShowContact = true || origin !== 'wechat-app';

  return (
    <LayoutStyled>
      <Modal
        title={<div style={{ fontSize: '0.85rem', fontWeight: 400, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
          <Trans i18nKey="contact.title" />
        </div>}
        open={modalVisible}
        destroyOnHidden={true}
        maskClosable={true}
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
        <HeroSection id="home" style={{ minHeight: posterHeight }}>
          <AuroraBackground />
          <AuroraOrb />
          <GridOverlay />
          <HeroContent>
            <HeroBadge><span /> Available for new projects</HeroBadge>
            <HeroTitle style={{ fontSize: catchPhraseSize, maxWidth: 800 }}>
              <Trans i18nKey="home.slogan" />
            </HeroTitle>
            <HeroSubtitle style={{ fontSize: Math.max(catchPhraseSize * 0.32, 14), maxWidth: 520 }}>
              <Trans i18nKey="home.catch_phrase" />
            </HeroSubtitle>
            {shouldShowContact && (
              <ContactButton type="default" size="large" onClick={openContactForm}>
                <Trans i18nKey="button.contact_us" />
              </ContactButton>
            )}
          </HeroContent>
        </HeroSection>

        <SectionDivider />

        <section id="services">
          <ServicesSection>
            <SectionLabel><Trans i18nKey="section.services.subtitle" /></SectionLabel>
            <SectionTitle><Trans i18nKey="section.services" /></SectionTitle>
            <Row gutter={[16, 16]}>
              {tileData.map((t, i) => (
                <Col key={i} {...tileSpanProps}>
                  <GlassCard $glowColor={t.color}>
                    <CardIcon $color={t.color}>{t.icon}</CardIcon>
                    <CardTitle>{t.title}</CardTitle>
                    {t.tags && t.tags.length > 0 && (
                      <div style={{ marginBottom: '0.6rem' }}>
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

        <SectionDivider />

        <section id="about_us">
          <HomeFeatureArea />
        </section>
      </ContentStyled>
      <HomeFooter />
      {shouldShowContact && (
        <AffixContactButton shape="default" size="large" onClick={openContactForm}>
          <AiOutlineMessage size={22} />
        </AffixContactButton>
      )}
    </LayoutStyled>
  );
}

export default HomePage;
