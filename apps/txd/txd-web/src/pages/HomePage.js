import React from 'react';

import styled from 'styled-components';

// import 'App.css';
import { Layout, Row, Col, Typography, Button, Modal, Affix, Tag } from 'antd';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import HomeFeatureArea from 'components/homeAreas/HomeFeatureArea';
import { RiComputerLine } from "react-icons/ri";
import { GoDeviceMobile, GoDatabase } from "react-icons/go";
import { AiOutlineWechat, AiOutlineMessage } from "react-icons/ai";
import { GiMeshNetwork, GiTeamIdea } from "react-icons/gi";
import windowSize from 'react-window-size';
import ContactForm from 'components/ContactForm';
import { Trans } from 'react-i18next';
import * as queryString from 'query-string';

const { Content } = Layout;
// const { Title } = Typography;

const Title = styled(Typography.Title)`
color: rgba(255,255,255,0.8) !important;
`;

const LayoutStyled = styled(Layout)`
  margin: 0 auto 0 auto;
  background-color: #ffffff;
  text-align: 'center'; 
  overflow-x: hidden;
`;

const ContentStyled = styled(Content)`
  margin: 0 auto 0 auto;
  // padding: 1rem;
  width: 100%;
`;

const PosterContainer = styled.div`
background-repeat: no-repeat;
background-size: cover;
background-position: center;
background-image: linear-gradient(rgba(0,0,0,0.1), rgba(0, 0, 0, 0.4)),url("images/poster.jpg");
width: 100%;
min-height: 200px;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
padding: 1rem;
padding-top: 40px;

.ant-typography {
  color: rgba(255,255,255,1) !important;
  text-align: center;
}

`;

const ContactButton = styled(Button)`
width: 100%;
max-width: 400px;
background-color: rgba(0,0,0,0.5);
border: 3px solid white;
margin-top: 1rem;
height: 60px !important;

&:hover {
  border: 3px solid rgba(255,255,255,0.8);
}

&:active {
  border: 3px solid rgba(255,255,255,0.8);
}
`;

const AffixContactButton = styled(Button)`
width: 60px;
height: 60px;
display: flex;
align-items: center;
justify-content: center;
border: none;
// background-color: rgba(34, 7, 94, 0.8);
background-color: rgba(255,255,255, 0.8);
color: rgba(34, 7, 94, 0.8);
box-shadow: 1px 1px 5px #22075e;

&:focus,&:hover,&:active {
  border: none;
  background-color: rgba(255,255,255, 0.8);
  color: rgb(34, 7, 94);
}
`;

const StyledTag = styled(Tag)`
color: #d99245;
border: 1px solid #d99245;
background-color: rgba(217, 146, 69,0.1);
border-radius: 999px;
margin: 2px;
`;

const tileSpanProps = {
  xs: 24,
  sm: 24,
  md: 12,
  lg: 8,
  xl: 8,
  xxl: 8,
}

const iconSize = 100;

const tileData = [
  {
    title: <Trans i18nKey="feature.title.website" />,
    tags: [
      <Trans i18nKey="tag.portal" />,
      <Trans i18nKey="tag.webapp" />,
      <Trans i18nKey="tag.custom_design" />,
      // 'hosting',
      // 'from $199'
    ],
    content: <Trans i18nKey="feature.description.website" />,
    icon: <RiComputerLine size={iconSize}></RiComputerLine>,
    backgroundColor: '#e6f7ff',
    color: '#0050b3'
  },
  {
    title: <Trans i18nKey="feature.title.mobile" />,
    tags: [
      <Trans i18nKey="tag.app_dev" />,
      <Trans i18nKey="tag.mobile_api" />,
      <Trans i18nKey="tag.hosting" />,
    ],
    content: <Trans i18nKey="feature.description.mobile" />,
    icon: <GoDeviceMobile size={iconSize}></GoDeviceMobile>,
    backgroundColor: '#fff0f6',
    color: '#c41d7f'
  },
  {
    title: <Trans i18nKey="feature.title.wechat" />,
    tags: [
      <Trans i18nKey="tag.wechat_mini" />,
      <Trans i18nKey="tag.wechat_public" />,
      <Trans i18nKey="tag.wechat_api" />,
      // 'from $399'
    ],
    content: <Trans i18nKey="feature.description.wechat" />,
    icon: <AiOutlineWechat size={iconSize}></AiOutlineWechat>,

    backgroundColor: '#f6ffed',
    color: '#389e0d'

  },
  {
    title: <Trans i18nKey="feature.title.database" />,
    tags: [
      <Trans i18nKey="tag.free_quote" />,
      <Trans i18nKey="tag.schema" />,
      <Trans i18nKey="tag.big_data" />,
    ],
    content: <Trans i18nKey="feature.description.database" />,
    icon: <GoDatabase size={iconSize}></GoDatabase>,
    backgroundColor: '#f9f0ff',
    color: '#9254de'
  },
  {
    title: <Trans i18nKey="feature.title.digitizing" />,
    tags: [
      <Trans i18nKey="tag.free_quote" />,
      <Trans i18nKey="tag.custom_solution" />,
      <Trans i18nKey="tag.e_commerce" />,
    ],
    content: <Trans i18nKey="feature.description.digitizing" />,
    icon: <GiMeshNetwork size={iconSize}></GiMeshNetwork>,
    backgroundColor: '#feffe6',
    color: '#fadb14'
  },
  {
    title: <Trans i18nKey="feature.title.consulting" />,
    tags: [
      <Trans i18nKey="tag.full_stack" />,
      <Trans i18nKey="tag.architecture" />,
      <Trans i18nKey="tag.ba" />,
    ],
    content: <Trans i18nKey="feature.description.consulting" />,
    icon: <GiTeamIdea size={iconSize}></GiTeamIdea>,
    backgroundColor: '#e6fffb',
    color: '#13c2c2'
  },
]

class HomePageRaw extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      modalVisible: false
    }

    this.contactFormRef = React.createRef();
  }

  handleContactCancel = () => {
    this.setState({
      modalVisible: false
    }, () => this.resetContactForm());
  }

  handleContactOk = () => {
    this.setState({
      modalVisible: false
    }, () => this.resetContactForm());
  }

  resetContactForm = () => {
    this.contactFormRef.current.reset();
  }

  openContactForm = () => {
    this.setState({
      modalVisible: true
    }, () => {
      setTimeout(() => {
        if (this.contactFormRef.current) {
          this.contactFormRef.current.focus()
        }
      }, 300);
    });
  }

  render() {
    const { windowWidth } = this.props;
    const posterHeight = windowWidth < 576 ? 340 :
      windowWidth < 992 ? 400 :
        500;

    const catchPhraseSize = windowWidth < 576 ? 28 :
      windowWidth < 992 ? 36 :
        44;

    const { origin } = queryString.parse(this.props.location.search);
    const shouldShowContact = origin !== 'wechat-app';

    return (
      <LayoutStyled>
        <Modal
          title={<div style={{ fontSize: '1rem', fontWeight: 300 }}>
            <Trans i18nKey="contact.title" />
          </div>}
          visible={this.state.modalVisible}
          onOk={this.handleContactOk}
          onCancel={this.handleContactCancel}
          footer={null}
          centered={true}
        >
          <ContactForm ref={this.contactFormRef} onDone={this.handleContactCancel}></ContactForm>
        </Modal>
        <HomeHeader onClickContact={() => this.openContactForm()}></HomeHeader>
        {/* <BarStyled></BarStyled> */}
        <ContentStyled >
          <section id="home">
            <PosterContainer style={{ height: posterHeight, position: 'relative' }}>
              <Title style={{ fontSize: catchPhraseSize, marginTop: '2rem' }}><Trans i18nKey="home.slogan" /></Title>
              <Title level={2} style={{ marginTop: 0, fontWeight: 400, fontSize: Math.max(catchPhraseSize * 0.6, 14) }}>
                <Trans i18nKey="home.catch_phrase" />
              </Title>
              {shouldShowContact && <ContactButton type="primary" shape="round" size="large" onClick={() => this.openContactForm()}>
                <Trans i18nKey="button.contact_us" />
              </ContactButton>}
            </PosterContainer>
          </section>
          <section id="services">
            <Row>
              {tileData.map((t, i) => {
                return (
                  <Col key={i} {...tileSpanProps} style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ color: 'rgba(34, 7, 94, 0.2)', margin: '1rem' }}>{t.icon}</div>
                    <Typography.Title level={3}>{t.title}</Typography.Title>
                    {(t.tags && t.tags.length > 0) ? <p>
                      {t.tags.map((tag, j) => <StyledTag key={j}>{tag}</StyledTag>)}
                    </p> : null}
                    <p>
                      {t.content}
                    </p>
                  </Col>
                );
              })}
            </Row>
          </section>
          <section id="about_us">
            <HomeFeatureArea style={{ paddingBottom: 0 }}></HomeFeatureArea>
          </section>
        </ContentStyled>
        <HomeFooter></HomeFooter>
        {shouldShowContact && <Affix style={{ position: 'fixed', bottom: 30, right: 30 }}>
          <AffixContactButton type="primary" shape="circle" size="large" onClick={() => this.openContactForm()}>
            <AiOutlineMessage size={36} />
          </AffixContactButton>
        </Affix>}
      </LayoutStyled>
    );
  }
}

HomePageRaw.propTypes = {};

HomePageRaw.defaultProps = {};

export const HomePage = windowSize(HomePageRaw)

export default HomePage;
