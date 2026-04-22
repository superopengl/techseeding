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
z-index: 1;
width: 100%;
background-color: rgba(0,0,0,0.6);
display: flex;
white-space: nowrap;
border: 0;
justify-content: space-between;
align-items: center;
padding-left: 0px;
padding-right: 20px;
color: white;

& .ant-menu {
  background-color: transparent;

  & .ant-menu-item {
    top: 0;

    & a,button {
      color: rgba(255,255,255,0.7);
      padding-left: 0;
      padding-right: 0;

      &:hover {
        color: #ffffff;
      }
    }
  }

  & .ant-menu-item:hover {
    color: #ffffff;
    border-color: #ffffff;
  }

  .ant-menu-item-selected,.ant-menu-item-selected {
    border-color: transparent;
  }
}

`;

const MenuContainer = styled.div`
float: right;
margin-bottom: 2px;
`;

const headerHeight = 48;

const HeaderLogo = styled.a`
display: flex;
height: ${headerHeight}px;
`;

const StyledDrawer = styled(Drawer)`
color: #013a8c;

a {
  color: #013a8c !important;
}

.ant-menu-item, .ant-menu-item:active, .ant-menu-item-selected {
  background-color: white !important;
  color: #013a8c !important;
}

svg {
  position: relative;
  top: 2px;
  margin-right: 1rem;
  color: #013a8c;
}
`;

const LogoImg = styled.img`
  height: ${headerHeight - 16}px;
  width: auto;
  margin-left: 8px;
  position: relative;
  top: -8px;
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

  const desktopMenuItems = [
    {
      key: 'home',
      label: <a href="#home" onClick={scrollTo('home')}><Trans i18nKey="header.home" /></a>,
    },
    {
      key: 'events',
      label: <a href="#services" onClick={scrollTo('services')}><Trans i18nKey="header.services" /></a>,
    },
    {
      key: 'about_us',
      label: <a href="#about_us" onClick={scrollTo('about_us')}><Trans i18nKey="header.about_us" /></a>,
    },
    ...(shouldShowContact ? [{
      key: 'contact',
      label: <Button type="link" onClick={handleClickContact}><Trans i18nKey="header.contact" /></Button>,
    }] : []),
    {
      key: 'lng',
      label: <LangToggleButton onClick={toggleLanguage} />,
    },
  ];

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
        <MenuContainer>
          <Menu mode="horizontal" style={{ border: 0 }} items={desktopMenuItems} />
        </MenuContainer>
      ) : (
        <>
          <Button type="link" style={{ backgroundColor: 'transparent', color: 'white' }} onClick={() => setDrawerVisible(true)}>
            <MenuOutlined />
          </Button>
          <StyledDrawer
            placement="right"
            closable={false}
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={240}
          >
            <Menu mode="vertical" style={{ border: 0 }} items={mobileMenuItems} />
          </StyledDrawer>
        </>
      )}
    </HeaderStyled>
  );
}

export default HomeHeader;
