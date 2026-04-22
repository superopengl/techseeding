import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Layout, Menu, Drawer, Button } from 'antd';
import { useMediaQuery } from 'react-responsive';
import { MenuOutlined } from '@ant-design/icons';
import { AiFillMessage } from "react-icons/ai";
import { BsPeopleFill } from "react-icons/bs";
import { FaHome } from "react-icons/fa";
import { MdRoomService, MdLanguage } from "react-icons/md";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Trans } from 'react-i18next';
import LangToggleButton from './LangToggleButton';

const { Header } = Layout;

const HeaderStyled = styled(Header)`
  position: fixed;
  z-index: 100;
  width: 100%;
  height: 56px;
  line-height: 56px;
  display: flex;
  white-space: nowrap;
  border: 0;
  justify-content: space-between;
  align-items: center;
  padding-left: 16px;
  padding-right: 20px;
  background: rgba(10, 15, 30, 0.6);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 28px;
`;

const NavLink = styled.a`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: color 0.2s ease;
  cursor: pointer;

  &:hover {
    color: #ffffff;
  }
`;

const NavButton = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }
`;

const headerHeight = 56;

const HeaderLogo = styled.a`
  display: flex;
  align-items: center;
  height: ${headerHeight}px;
`;

const StyledDrawer = styled(Drawer)`
  .ant-drawer-content {
    background: rgba(15, 20, 40, 0.9) !important;
    backdrop-filter: blur(40px) !important;
    -webkit-backdrop-filter: blur(40px) !important;
  }

  .ant-drawer-body {
    padding: 1rem 0;
  }

  a {
    color: rgba(255, 255, 255, 0.7) !important;
    transition: color 0.2s ease;

    &:hover {
      color: white !important;
    }
  }

  .ant-menu {
    background: transparent !important;
    border: none !important;
  }

  .ant-menu-item {
    color: rgba(255, 255, 255, 0.7) !important;
    border-radius: 8px;
    margin: 2px 8px;

    &:hover, &:active, &.ant-menu-item-selected {
      background: rgba(255, 255, 255, 0.06) !important;
      color: white !important;
    }
  }

  svg {
    position: relative;
    top: 2px;
    margin-right: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const LogoImg = styled.img`
  height: 28px;
  width: auto;
  opacity: 0.75;
  filter: brightness(0.85) sepia(1) hue-rotate(200deg) saturate(2);
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.95;
    filter: brightness(1) sepia(1) hue-rotate(200deg) saturate(1.5);
  }
`;

function smoothScrollTo(id, offset = 0) {
  const element = document.getElementById(id);
  if (element) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

function HomeHeader({ onClickContact }) {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery({ minWidth: 801 });

  const origin = searchParams.get('origin');
  const shouldShowContact = true || origin !== 'wechat-app';

  const scrollTo = useCallback((id) => (e) => {
    e.preventDefault();
    smoothScrollTo(id, headerHeight);
  }, []);

  const scrollToAndClose = useCallback((id) => (e) => {
    e.preventDefault();
    setDrawerVisible(false);
    smoothScrollTo(id, headerHeight);
  }, []);

  const handleClickContact = useCallback(() => {
    setDrawerVisible(false);
    onClickContact();
  }, [onClickContact]);

  const toggleLanguage = useCallback(() => {
    const lng = searchParams.get('lng');
    const lang = lng === 'zh' ? 'en' : 'zh';
    navigate({ search: `?lng=${lang}` });
    window.location.reload();
  }, [searchParams, navigate]);

  const mobileMenuItems = [
    {
      key: 'home',
      icon: <FaHome />,
      label: <a href="#home" onClick={scrollToAndClose('home')}><Trans i18nKey="header.home" /></a>,
    },
    {
      key: 'events',
      icon: <MdRoomService />,
      label: <a href="#services" onClick={scrollToAndClose('services')}><Trans i18nKey="header.services" /></a>,
    },
    {
      key: 'about_us',
      icon: <BsPeopleFill />,
      label: <a href="#about_us" onClick={scrollToAndClose('about_us')}><Trans i18nKey="header.about_us" /></a>,
    },
    ...(shouldShowContact ? [{
      key: 'contact',
      icon: <AiFillMessage />,
      label: <Trans i18nKey="header.contact" />,
      onClick: handleClickContact,
    }] : []),
    {
      key: 'lang',
      icon: <MdLanguage />,
      label: 'EN / 简中',
      onClick: toggleLanguage,
    },
  ];

  return (
    <HeaderStyled>
      <HeaderLogo href="#home" onClick={scrollTo('home')}>
        <LogoImg src="/logo-light.png" alt="TECHSEEDING LOGO" />
      </HeaderLogo>
      {isDesktop ? (
        <DesktopNav>
          <NavLink href="#home" onClick={scrollTo('home')}><Trans i18nKey="header.home" /></NavLink>
          <NavLink href="#services" onClick={scrollTo('services')}><Trans i18nKey="header.services" /></NavLink>
          <NavLink href="#about_us" onClick={scrollTo('about_us')}><Trans i18nKey="header.about_us" /></NavLink>
          {shouldShowContact && <NavButton onClick={handleClickContact}><Trans i18nKey="header.contact" /></NavButton>}
          <LangToggleButton onClick={toggleLanguage} />
        </DesktopNav>
      ) : (
        <>
          <Button
            type="text"
            style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}
            onClick={() => setDrawerVisible(true)}
          >
            <MenuOutlined />
          </Button>
          <StyledDrawer
            placement="right"
            closable={false}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={260}
            styles={{ mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.3)' } }}
          >
            <Menu mode="vertical" style={{ border: 0 }} items={mobileMenuItems} />
          </StyledDrawer>
        </>
      )}
    </HeaderStyled>
  );
}

export default HomeHeader;
