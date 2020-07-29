import React from 'react';
import { Typography } from 'antd';
import HomeRowArea from "./HomeRowArea";
import styled from 'styled-components';
import { MailOutlined, PhoneOutlined, WechatOutlined } from '@ant-design/icons';
import { Trans } from 'react-i18next';
import { MdOpenInNew } from "react-icons/md";
import { CopyToClipboardButton } from '../CopyToClipboardButton';

const SubTitle = styled(Typography.Title)`
color: #dddddd !important;
`

const InfoCard = styled.div`
box-sizing: border-box;
width: 100%;
margin-bottom: 2rem;

a {
  color: #dddddd;

  &:hover {
    color: white;
    text-decoration: underline;
  }
}
`;

const ContactSection = styled.section`
  & p {
    margin:0;
    height
  }
`;
class HomeFeatureArea extends React.Component {
  render() {
    const props = {
      bgColor: '',
      span: {
        xs: 24,
        sm: 24,
        md: 24,
        lg: 8,
        xl: 8,
        xxl: 8
      },
      style: {
        backgroundColor: '#22075e',
        color: '#f0f0f0',
        paddingBottom: 0
      }
    }

    return (
      <HomeRowArea {...props}>
        <InfoCard>
          <SubTitle level={3}>
            <Trans i18nKey="home.about_us" />
          </SubTitle>
          <section>
            <Trans i18nKey="home.about_us.content" />
          </section>
        </InfoCard>
        <InfoCard>
          <SubTitle level={3}>
            <Trans i18nKey="home.contact" />
          </SubTitle>
          <ContactSection>
            <p>
              <MdOpenInNew style={{ position: 'relative', top: 2 }} /> <Trans i18nKey="home.contact.website" /> : <a target="blank" referrerPolicy="no-referrer" href="https://www.techseeding.com.au/">https://www.techseeding.com.au</a>
              <CopyToClipboardButton value="https://www.techseeding.com.au/" />
            </p>
            <p>
              <MailOutlined /> <Trans i18nKey="home.contact.email" /> : <a href="mailto:mr.shaojun@gmail.com">mr.shaojun@gmail.com</a>
              <CopyToClipboardButton value="mr.shaojun@gmail.com" />
            </p>
            <p>
              <PhoneOutlined /> <Trans i18nKey="home.contact.phone" /> : <a href="tel:+61405581228">+61 4 0558 1228</a>
              <CopyToClipboardButton value="+61405581228" />
            </p>
            <p>
              <WechatOutlined /> <Trans i18nKey="home.contact.wechat" /> : <a href="weixin://dl/chat?superopengl">superopengl</a>
              <CopyToClipboardButton value="superopengl" />
            </p>
            <p style={{marginTop: '1rem'}}>
              <img src="images/wechat_logo_qr.jpg" alt="wechat account: superopengl" width={160} height="auto" />
            </p>
          </ContactSection>

        </InfoCard>
        <InfoCard>
          <SubTitle level={3}>
            <Trans i18nKey="home.why_us" />
          </SubTitle>
          <section>
            <Trans i18nKey="home.why_us.content" />
          </section>
        </InfoCard>
      </HomeRowArea>
    );
  }
}

HomeFeatureArea.propTypes = {};

HomeFeatureArea.defaultProps = {};

export default HomeFeatureArea;
