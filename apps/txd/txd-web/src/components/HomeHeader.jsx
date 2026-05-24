import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Layout, Menu, Drawer, Button, Dropdown } from 'antd';
import { useMediaQuery } from 'react-responsive';
import { MenuOutlined, DownOutlined } from '@ant-design/icons';
import { MdLanguage, MdApps } from "react-icons/md";
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Trans } from 'react-i18next';
import LangToggleButton from './LangToggleButton';
import kidPlayAiLogo from 'images/logo-kidplayai.png';
import youTutorAiLogo from 'images/logo-yoututorai.png';

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

const NavTrigger = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 400;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }

  .anticon {
    font-size: 10px;
    opacity: 0.6;
  }
`;

const ProductMenuItemLink = styled.a`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 6px;
  line-height: 1.2;
`;

const ProductLogo = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 10px;
  object-fit: contain;
  background: #ffffff;
  padding: 4px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ProductTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ProductName = styled.span`
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.15;
`;

const ProductTagline = styled.span`
  font-size: 12px;
  font-weight: 400;
  opacity: 0.65;
  line-height: 1.35;
  white-space: normal;
`;

const productDropdownStyles = {
  root: { minWidth: 300 },
};

const productMenuStyle = {
  padding: 6,
};

const productMenuItemStyle = {
  height: 'auto',
  lineHeight: 1.2,
  padding: '4px 10px',
};

const productMenuItems = [
  {
    key: 'kidplayai',
    style: productMenuItemStyle,
    label: (
      <ProductMenuItemLink href="https://kidplayai.techseeding.com.au/" target="_blank" rel="noopener noreferrer">
        <ProductLogo src={kidPlayAiLogo} alt="KidPlayAI" />
        <ProductTextBlock>
          <ProductName>KidPlayAI</ProductName>
          <ProductTagline>Playful AI adventures for curious kids, ages 8–12+</ProductTagline>
        </ProductTextBlock>
      </ProductMenuItemLink>
    ),
  },
  {
    key: 'yoututorai',
    style: productMenuItemStyle,
    label: (
      <ProductMenuItemLink href="https://yoututorai.techseeding.com.au/" target="_blank" rel="noopener noreferrer">
        <ProductLogo src={youTutorAiLogo} alt="YouTutorAI" />
        <ProductTextBlock>
          <ProductName>YouTutorAI</ProductName>
          <ProductTagline>Personalized AI tutoring for students Y3–Y12</ProductTagline>
        </ProductTextBlock>
      </ProductMenuItemLink>
    ),
  },
];

const headerHeight = 56;

const HeaderLogo = styled(Link)`
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
  opacity: 0.9;
  filter: brightness(1.1) sepia(1) hue-rotate(200deg) saturate(1.5);
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    filter: brightness(1.3) sepia(1) hue-rotate(200deg) saturate(1.2);
  }
`;

function HomeHeader() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery({ minWidth: 801 });

  const toggleLanguage = useCallback(() => {
    const lng = searchParams.get('lng');
    const lang = lng === 'zh' ? 'en' : 'zh';
    navigate({ search: `?lng=${lang}` });
    window.location.reload();
  }, [searchParams, navigate]);

  const mobileMenuItems = [
    {
      key: 'products',
      icon: <MdApps />,
      label: <Trans i18nKey="header.products" />,
      children: [
        {
          key: 'kidplayai',
          style: { height: 'auto', lineHeight: 1.2, padding: '8px 12px' },
          label: (
            <ProductMenuItemLink
              href="https://kidplayai.techseeding.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerVisible(false)}
            >
              <ProductLogo src={kidPlayAiLogo} alt="KidPlayAI" />
              <ProductTextBlock>
                <ProductName>KidPlayAI</ProductName>
                <ProductTagline>Playful AI adventures for curious kids, ages 8–12+</ProductTagline>
              </ProductTextBlock>
            </ProductMenuItemLink>
          ),
        },
        {
          key: 'yoututorai',
          style: { height: 'auto', lineHeight: 1.2, padding: '8px 12px' },
          label: (
            <ProductMenuItemLink
              href="https://yoututorai.techseeding.com.au/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setDrawerVisible(false)}
            >
              <ProductLogo src={youTutorAiLogo} alt="YouTutorAI" />
              <ProductTextBlock>
                <ProductName>YouTutorAI</ProductName>
                <ProductTagline>Personalized AI tutoring for students Y3–Y12</ProductTagline>
              </ProductTextBlock>
            </ProductMenuItemLink>
          ),
        },
      ],
    },
    {
      key: 'lang',
      icon: <MdLanguage />,
      label: 'EN / 简中',
      onClick: toggleLanguage,
    },
  ];

  return (
    <HeaderStyled>
      <HeaderLogo to="/">
        <LogoImg src="/logo-light.png" alt="TECHSEEDING LOGO" />
      </HeaderLogo>
      {isDesktop ? (
        <DesktopNav>
          <Dropdown
            menu={{ items: productMenuItems, style: productMenuStyle }}
            placement="bottom"
            styles={productDropdownStyles}
          >
            <NavTrigger>
              <Trans i18nKey="header.products" />
              <DownOutlined />
            </NavTrigger>
          </Dropdown>
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
            size={320}
            styles={{ mask: { backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.3)' } }}
          >
            <Menu
              mode="inline"
              inlineIndent={16}
              style={{ border: 0 }}
              items={mobileMenuItems}
              openKeys={['products']}
              expandIcon={() => null}
            />
          </StyledDrawer>
        </>
      )}
    </HeaderStyled>
  );
}

export default HomeHeader;
