import React from 'react';
import styled from 'styled-components';
import { useSearchParams, Link } from 'react-router-dom';
import { Trans } from 'react-i18next';

const FooterStyled = styled.footer`
  background: var(--cobalt-deep);
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  line-height: 1.6;
`;

const FooterInner = styled.div`
  max-width: var(--measure);
  margin: 0 auto;
  padding: 2rem var(--gutter);
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1rem 2rem;

  p {
    margin: 0;
  }

  a {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-color: rgba(255, 255, 255, 0.4);

    &:hover {
      color: #fff;
      text-decoration-color: #fff;
    }
  }
`;

const VersionInfo = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
`;

function HomeFooter() {
  const [searchParams] = useSearchParams();
  const wechat_app_ver = searchParams.get('wechat_app_ver');
  const gitCommitHash = import.meta.env.VITE_GIT_HASH || 'dev';
  const versionInfo = `Version: ${gitCommitHash}${wechat_app_ver ? ` / WeChat Mini Program Version: ${wechat_app_ver}` : ''}`;

  return (
    <FooterStyled id="about">
      <FooterInner>
        <div>
          <p>&copy; 2019–{new Date().getFullYear()} Techseeding PTY LTD. All rights reserved.</p>
          <p>ABN 35 631 597 450, ACN 631 597 450</p>
        </div>
        <p>
          <Link to="/privacy_policy"><Trans i18nKey="footer.privacy_policy" /></Link>
        </p>
        <VersionInfo>{versionInfo}</VersionInfo>
      </FooterInner>
    </FooterStyled>
  );
}

export default HomeFooter;
