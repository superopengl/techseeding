import React, { useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { Layout } from 'antd';
import HomeHeader, { headerHeight } from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import ContactForm from 'components/ContactForm';
import { useTranslation } from 'react-i18next';
import { products } from 'components/products';
import SeedField from 'components/SeedField';

const LayoutStyled = styled(Layout)`
  background: var(--paper);
  min-height: 100vh;
`;

const Wrap = styled.div`
  max-width: var(--measure);
  margin: 0 auto;
  padding-left: var(--gutter);
  padding-right: var(--gutter);
`;

/* ─── Hero ─── */

// Each word of the slogan settles at a heavier weight than the one before it,
// so the headline itself "grows" from left to right.
const grow = keyframes`
  from { font-weight: 200; }
  to { font-weight: var(--w); }
`;

const settle = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
`;

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  background: var(--cobalt);
  color: #fff;
  padding-top: calc(${headerHeight}px + clamp(3rem, 10vh, 7rem));
  padding-bottom: clamp(3rem, 8vh, 5.5rem);
`;

const Slogan = styled.h1`
  position: relative;
  z-index: 1;
  margin: 0;
  max-width: 13ch;
  font-size: clamp(2.75rem, 8vw, 6.75rem);
  font-variation-settings: 'opsz' 96;
  line-height: 0.98;
  letter-spacing: -0.035em;
  color: #fff;

  &:lang(zh) {
    max-width: 9em;
    line-height: 1.12;
    letter-spacing: 0;
  }

  span {
    font-weight: var(--w);
    animation: ${grow} 1.1s cubic-bezier(0.2, 0.7, 0.2, 1) both;
    animation-delay: calc(var(--i) * 90ms + 150ms);
  }
`;

const HeroTop = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 4fr);
  align-items: center;
  gap: 2rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroSeeds = styled.div`
  position: relative;
  z-index: 0;

  @media (max-width: 900px) {
    position: absolute;
    top: 3.5rem;
    right: -18vw;
    width: 72vw;
    opacity: 0.4;
  }
`;

const HeroFoot = styled.div`
  margin-top: clamp(2.5rem, 7vh, 4.5rem);
  animation: ${settle} 0.8s cubic-bezier(0.2, 0.7, 0.2, 1) 0.9s both;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
`;

const HeroLede = styled.div`
  position: relative;
  max-width: 36ch;

  p {
    margin: 0;
    font-size: clamp(1.1rem, 1.6vw, 1.3rem);
    line-height: 1.45;
    color: rgba(255, 255, 255, 0.92);
  }

  p + p {
    margin-top: 0.75rem;
    font-size: 0.95rem;
    color: rgba(255, 255, 255, 0.65);
  }
`;

export const SproutButton = styled.button`
  appearance: none;
  border: 0;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  font-size: 1.05rem;
  color: var(--ink);
  background: var(--sprout);
  padding: 0.95rem 1.6rem;
  border-radius: 999px;
  transition: background-color 0.15s ease;

  &:hover {
    background: #86ecc0;
  }

  &:active {
    background: #3fcf8f;
  }

  &:focus-visible {
    outline-color: #fff;
  }

  &:disabled {
    cursor: progress;
    opacity: 0.6;
  }
`;

/* ─── Stack band ─── */

const StackBand = styled.section`
  background: var(--sprout);
  color: var(--ink);
  padding-top: clamp(1.75rem, 4vw, 2.75rem);
  padding-bottom: clamp(1.75rem, 4vw, 2.75rem);

  h2 {
    margin: 0 0 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    color: var(--cobalt-deep);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.15rem 0;
  }

  li {
    font-size: clamp(1.35rem, 3vw, 2.25rem);
    font-weight: 720;
    letter-spacing: -0.02em;
    line-height: 1.25;
    display: inline-flex;
    align-items: center;
  }

  li:not(:last-child)::after {
    content: '';
    width: 0.3em;
    height: 0.3em;
    margin: 0 0.5em;
    border-radius: 50%;
    background: var(--cobalt);
  }
`;

/* ─── Shared section scaffolding ─── */

const Section = styled.section`
  padding-top: clamp(4rem, 10vw, 7.5rem);
  padding-bottom: clamp(4rem, 10vw, 7.5rem);
`;

const SectionHead = styled.div`
  h2 {
    margin: 0;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.05;
    color: var(--cobalt);
  }

  p {
    margin: 0.9rem 0 0;
    max-width: 30ch;
    color: var(--slate);
  }
`;

/* ─── Services ─── */

const ServicesGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 7fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;

  ${SectionHead} {
    position: sticky;
    top: calc(${headerHeight}px + 2rem);
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;

    ${SectionHead} {
      position: static;
    }
  }
`;

const ServiceSeeds = styled.div`
  width: min(260px, 100%);
  margin-top: 2.5rem;

  @media (max-width: 820px) {
    display: none;
  }
`;

const ServiceList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Service = styled.li`
  padding: 1.75rem 0 2rem;
  border-top: 1px solid var(--rule);

  &:first-child {
    padding-top: 0;
    border-top: 0;
  }

  h3 {
    margin: 0 0 0.5rem;
    font-size: clamp(1.5rem, 2.4vw, 1.9rem);
    font-weight: 680;
    letter-spacing: -0.015em;
    color: var(--ink);
  }

  p {
    margin: 0;
    max-width: 62ch;
    color: #34405a;
  }

  small {
    display: block;
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--cobalt);
  }
`;

/* ─── Products ─── */

const ProductsSection = styled(Section)`
  padding-top: 0;
`;

const ProductGrid = styled.div`
  margin-top: 2.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
`;

const ProductLink = styled.a`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.4rem 1.25rem;
  align-items: center;
  padding: 1.5rem;
  padding: clamp(1.5rem, 3vw, 2.25rem);
  background: var(--tint);
  border: 2px solid transparent;
  border-radius: 18px;
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: var(--accent);
    color: var(--ink);
  }

  img {
    grid-row: span 2;
    width: 96px;
    height: 96px;
    padding: 10px;
    object-fit: contain;
    background: #fff;
    border-radius: 22px;
  }

  strong {
    font-size: 1.4rem;
    font-weight: 680;
    letter-spacing: -0.015em;
  }

  span {
    color: var(--slate);
    line-height: 1.4;
  }

  em {
    grid-column: 2;
    margin-top: 0.6rem;
    font-style: normal;
    font-weight: 600;
    color: var(--accent);
    text-decoration: underline;
    text-underline-offset: 0.2em;
    text-decoration-thickness: 1px;
  }

  &:hover em {
    text-decoration-thickness: 2px;
  }
`;

/* ─── Contact ─── */

const ContactBand = styled.section`
  position: relative;
  overflow: hidden;
  background: var(--cobalt);
  color: #fff;
  padding-top: clamp(4rem, 10vw, 7rem);
  padding-bottom: clamp(4rem, 10vw, 7rem);
`;

const ContactSeeds = styled.div`
  position: absolute;
  left: -4rem;
  bottom: -6rem;
  width: min(420px, 60vw);
  opacity: 0.35;
  transform: scaleY(-1);
  pointer-events: none;
`;

const ContactGrid = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  gap: clamp(2rem, 6vw, 6rem);

  h2 {
    margin: 0;
    font-size: clamp(2.25rem, 5vw, 3.75rem);
    font-weight: 750;
    letter-spacing: -0.03em;
    line-height: 1;
    color: #fff;
  }

  p {
    margin: 1rem 0 0;
    max-width: 32ch;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const stack = ['Node.js', 'TypeScript', 'React', 'Web app', 'Mobile', 'PostgreSQL', 'MongoDB', 'SQL Server', 'Docker', 'AWS', 'Azure', 'Agentic UI'];

const productColors = {
  kidplayai: { '--tint': '#dff3e6', '--accent': '#1f7a4a' },
  yoututorai: { '--tint': '#e7e5f4', '--accent': '#4b4a8f' },
};

const serviceKeys = [
  { key: 'ai', tags: ['ai_chatbot', 'ai_automation', 'ai_integration'] },
  { key: 'website', tags: ['portal', 'webapp', 'custom_design'] },
  { key: 'mobile', tags: ['app_dev', 'mobile_api', 'hosting'] },
  { key: 'wechat', tags: ['wechat_mini', 'wechat_public', 'wechat_api'] },
  { key: 'digitizing', tags: ['free_quote', 'custom_solution', 'e_commerce'] },
  { key: 'consulting', tags: ['full_stack', 'architecture', 'ba'] },
];

function GrowingSlogan({ text, lang }) {
  // English grows word by word; Chinese has no spaces, so it grows per character.
  const tokens = lang === 'zh' ? Array.from(text) : text.split(' ');
  const joiner = lang === 'zh' ? '' : ' ';
  const min = 260;
  const max = 800;
  const step = tokens.length > 1 ? (max - min) / (tokens.length - 1) : 0;

  return (
    <Slogan lang={lang} aria-label={text}>
      {tokens.map((word, i) => (
        <React.Fragment key={i}>
          <span aria-hidden="true" style={{ '--w': Math.round(min + step * i), '--i': i }}>{word}</span>
          {i < tokens.length - 1 && joiner}
        </React.Fragment>
      ))}
    </Slogan>
  );
}

function HomePage() {
  const contactFormRef = useRef(null);
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('zh') ? 'zh' : 'en';

  const openContactForm = useCallback(() => {
    const section = document.getElementById('contact');
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
    setTimeout(() => {
      contactFormRef.current?.focus();
    }, 600);
  }, []);

  return (
    <LayoutStyled>
      <HomeHeader />
      <main>
        <Hero id="home">
          <Wrap>
            <HeroTop>
              <GrowingSlogan text={t('home.slogan')} lang={lang} />
              <HeroSeeds>
                <SeedField animate />
              </HeroSeeds>
            </HeroTop>
            <HeroFoot>
              <HeroLede>
                <p>{t('home.catch_phrase')}</p>
                <p>{t('home.location')}</p>
              </HeroLede>
              <SproutButton type="button" onClick={openContactForm}>
                {t('button.contact_us')}
              </SproutButton>
            </HeroFoot>
          </Wrap>
        </Hero>

        <StackBand aria-labelledby="stack-title">
          <Wrap>
            <h2 id="stack-title">{t('section.stack')}</h2>
            <ul>
              {stack.map((name) => <li key={name}>{name}</li>)}
            </ul>
          </Wrap>
        </StackBand>

        <Section id="services">
          <Wrap>
            <ServicesGrid>
              <SectionHead>
                <h2>{t('section.services')}</h2>
                <p>{t('section.services.intro')}</p>
                <ServiceSeeds>
                  <SeedField cols={6} rows={5} seed={3} palette={{ base: '#0a3d91', light: '#3da0f5', ripe: '#1fa36b' }} />
                </ServiceSeeds>
              </SectionHead>
              <ServiceList>
                {serviceKeys.map(({ key, tags }) => (
                  <Service key={key}>
                    <h3>{t(`feature.title.${key}`)}</h3>
                    <p>{t(`feature.description.${key}`)}</p>
                    <small>{tags.map((tag) => t(`tag.${tag}`)).join(lang === 'zh' ? '、' : ', ')}</small>
                  </Service>
                ))}
              </ServiceList>
            </ServicesGrid>
          </Wrap>
        </Section>

        <ProductsSection id="products">
          <Wrap>
            <SectionHead>
              <h2>{t('section.products')}</h2>
              <p>{t('section.products.intro')}</p>
            </SectionHead>
            <ProductGrid>
              {products.map((p) => (
                <ProductLink key={p.key} style={productColors[p.key]} href={p.url} target="_blank" rel="noopener noreferrer">
                  <img src={p.logo} alt="" />
                  <strong>{p.name}</strong>
                  <span>{t(`product.${p.key}.tagline`)}</span>
                  <em>{t('product.open', { name: p.name })}</em>
                </ProductLink>
              ))}
            </ProductGrid>
          </Wrap>
        </ProductsSection>

        <ContactBand id="contact">
          <ContactSeeds>
            <SeedField cols={8} rows={6} seed={21} palette={{ base: '#3da0f5', light: '#ffffff', ripe: '#3da0f5' }} />
          </ContactSeeds>
          <Wrap>
            <ContactGrid>
              <div>
                <h2>{t('button.contact_us')}</h2>
                <p>{t('contact.title')}</p>
              </div>
              <ContactForm ref={contactFormRef} showCancel={false} />
            </ContactGrid>
          </Wrap>
        </ContactBand>
      </main>
      <HomeFooter />
    </LayoutStyled>
  );
}

export default HomePage;
