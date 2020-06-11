import React from 'react';

import styled from 'styled-components';

// import 'App.css';
import { Layout, Row, Col, Typography, Button, Modal, Affix } from 'antd';
import HomeHeader from 'components/HomeHeader';
import HomeFooter from 'components/HomeFooter';
import HomeFeatureArea from 'components/homeAreas/HomeFeatureArea';
import { RiComputerLine } from "react-icons/ri";
import { GoDeviceMobile } from "react-icons/go";
import { AiOutlineWechat, AiOutlineMessage } from "react-icons/ai";
import { FiDatabase } from "react-icons/fi";
import { GiMeshNetwork, GiTeamIdea } from "react-icons/gi";
import windowSize from 'react-window-size';
import ContactForm from 'components/ContactForm';

const { Content } = Layout;
// const { Title } = Typography;

const Title = styled(Typography.Title)`
color: rgba(255,255,255,0.8);
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
background-image: url("images/poster.jpg");
width: 100%;
min-height: 200px;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
padding: 1rem;

.ant-typography {
  color: rgba(255,255,255,0.9) !important;
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
    title: 'Website',
    content: 'We provide all types of website development from static web portal to complext web application which is highly tailored for your unique business.',
    icon: <RiComputerLine size={iconSize}></RiComputerLine>,
    backgroundColor: '#e6f7ff',
    color: '#0050b3'
  },
  {
    title: 'Mobile Apps',
    content: `A mobile app can perform actions much quicker than a mobile website, and can be used to increase customer loyalty and to build the communication directly with your customers.`,
    icon: <GoDeviceMobile size={iconSize}></GoDeviceMobile>,
    backgroundColor: '#fff0f6',
    color: '#c41d7f'
  },
  {
    title: 'Wechat',
    content: 'Integration with Wechat and Wechat App (微信小程序，微信公众号) can be a sharp weapon for your business to expand to another world.',
    icon: <AiOutlineWechat size={iconSize}></AiOutlineWechat>,

    backgroundColor: '#f6ffed',
    color: '#389e0d'

  },
  {
    title: 'Database Design',
    content: `A well designed database schema can be very benefit to your business with high scalability and low cost. No hesitate to review your database when you feel it's slow down. Postgres SQL, MySQL, SQL Server, MongoDB, NoSQL, ... we will find a best home for you data.`,
    icon: <FiDatabase size={iconSize}></FiDatabase>,
    backgroundColor: '#f9f0ff',
    color: '#9254de'
  },
  {
    title: 'Digital Transformation',
    content: `It's the era to accelerate the digital transformation, which will give you a truely reliable bridge between you and your customers. Our professional business analyst will help you to figure out a best way to move your workflow to the digital world.`,
    icon: <GiMeshNetwork size={iconSize}></GiMeshNetwork>,
    backgroundColor: '#feffe6',
    color: '#fadb14'
  },
  {
    title: 'Tech Consulting',
    content: 'We provide technical consulting service in range of Python, Nodejs, C#, Reactjs, Angular, JavaScript, TypeScript, MongoDB, Postgres SQL, SQL Server, MySQL, Docker, AWS and Azure.',
    icon: <GiTeamIdea size={iconSize}></GiTeamIdea>,
    backgroundColor: '#e6fffb',
    color: '#13c2c2'
  },
]

class LandingPageRaw extends React.Component {
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

    return (
      <LayoutStyled>
        <Modal
          title={<div style={{ fontSize: '1rem', fontWeight: 300 }}>Let us tailor a service package that meets your needs. Tell us a little about your business, and we will get back to you with some ideas shortly.</div>}
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
              <Title style={{ fontSize: catchPhraseSize }}>E-solution to expand your business</Title>
              <Title level={2} style={{ marginTop: 0, fontWeight: 300, fontSize: Math.max(catchPhraseSize * 0.6, 14) }}>Want an e-solution to expand your business?</Title>
              <ContactButton type="primary" shape="round" size="large" onClick={() => this.openContactForm()}>Contact Us</ContactButton>
            </PosterContainer>
          </section>
          <section id="services">
            <Row>
              {tileData.map((t, i) => {
                return (
                  <Col key={i} {...tileSpanProps} style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ color: 'rgba(34, 7, 94, 0.2)', margin: '1rem' }}>{t.icon}</div>
                    <Title level={3}>{t.title}</Title>
                    <p>
                      {t.content}
                    </p>
                  </Col>
                );
              })}
            </Row>
          </section>
          <section id="contact_us">
            <HomeFeatureArea style={{ paddingBottom: 0 }}></HomeFeatureArea>
          </section>
        </ContentStyled>
        <HomeFooter></HomeFooter>
        <Affix style={{ position: 'fixed', bottom: 30, right: 30 }}>
          <AffixContactButton type="primary" shape="circle" size="large" onClick={() => this.openContactForm()}>
            <AiOutlineMessage size={36} />
          </AffixContactButton>
        </Affix>
      </LayoutStyled>
    );
  }
}

LandingPageRaw.propTypes = {};

LandingPageRaw.defaultProps = {};

export const LandingPage = windowSize(LandingPageRaw)

export default LandingPage;
