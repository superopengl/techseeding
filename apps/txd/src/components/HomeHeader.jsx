import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { Drawer, Dropdown } from 'antd';
import { useMediaQuery } from 'react-responsive';
import { MenuOutlined, CloseOutlined, DownOutlined } from '@ant-design/icons';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { products } from './products';

export const headerHeight = 64;

const HeaderStyled = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: ${headerHeight}px;
  background: var(--cobalt);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
`;

const HeaderInner = styled.div`
  max-width: var(--measure);
  height: 100%;
  margin: 0 auto;
  padding: 0 var(--gutter);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLogo = styled(Link)`
  display: flex;
  align-items: center;

  img {
    height: 22px;
    width: auto;
  }
`;

const DesktopNav = styled.nav`
  display: flex;
  align-items: center;
  gap: 2rem;
`;

const NavItem = styled.button`
  appearance: none;
  background: none;
  border: 0;
  padding: 0.25rem 0;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;

  &:hover {
    color: #fff;
  }

  .anticon {
    font-size: 0.65rem;
  }
`;

const ProductItem = styled.a`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.5rem 0.25rem;
  color: var(--ink);
  text-decoration: none;

  img {
    width: 44px;
    height: 44px;
    object-fit: contain;
    flex-shrink: 0;
  }

  strong {
    display: block;
    font-size: 1.05rem;
    font-weight: 650;
  }

  span {
    display: block;
    font-size: 0.85rem;
    line-height: 1.35;
    color: var(--slate);
    white-space: normal;
  }
`;

const DrawerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;

  h2 {
    margin: 0 0 0.5rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--slate);
  }

  ${NavItem} {
    color: var(--cobalt);
    font-size: 1.05rem;
  }
`;

function LangToggleButton({ onClick }) {
  return (
    <NavItem type="button" onClick={onClick} aria-label="Switch language / 切换语言">
      EN / 简中
    </NavItem>
  );
}

function ProductEntry({ product, onClick }) {
  const { t } = useTranslation();
  return (
    <ProductItem href={product.url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
      <img src={product.logo} alt="" />
      <div>
        <strong>{product.name}</strong>
        <span>{t(`product.${product.key}.tagline`)}</span>
      </div>
    </ProductItem>
  );
}

function HomeHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isDesktop = useMediaQuery({ minWidth: 801 });

  const toggleLanguage = useCallback(() => {
    const lng = searchParams.get('lng');
    const lang = lng === 'zh' ? 'en' : 'zh';
    navigate({ search: `?lng=${lang}` });
    window.location.reload();
  }, [searchParams, navigate]);

  const productMenuItems = products.map((p) => ({
    key: p.key,
    label: <ProductEntry product={p} />,
  }));

  return (
    <HeaderStyled>
      <HeaderInner>
        <HeaderLogo to="/" aria-label="Techseeding home">
          <img src="/logo-light.png" alt="Techseeding" />
        </HeaderLogo>
        {isDesktop ? (
          <DesktopNav>
            <Dropdown
              menu={{ items: productMenuItems, style: { padding: 6 } }}
              placement="bottomRight"
              styles={{ root: { width: 340 } }}
            >
              <NavItem type="button">
                {t('header.products')}
                <DownOutlined />
              </NavItem>
            </Dropdown>
            <LangToggleButton onClick={toggleLanguage} />
          </DesktopNav>
        ) : (
          <>
            <NavItem type="button" aria-label="Open menu" onClick={() => setDrawerOpen(true)} style={{ fontSize: 20 }}>
              <MenuOutlined />
            </NavItem>
            <Drawer
              placement="right"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
              size={320}
              closeIcon={<CloseOutlined aria-label="Close menu" />}
            >
              <DrawerBody>
                <div>
                  <h2>{t('header.products')}</h2>
                  {products.map((p) => (
                    <ProductEntry key={p.key} product={p} onClick={() => setDrawerOpen(false)} />
                  ))}
                </div>
                <LangToggleButton onClick={toggleLanguage} />
              </DrawerBody>
            </Drawer>
          </>
        )}
      </HeaderInner>
    </HeaderStyled>
  );
}

export default HomeHeader;
