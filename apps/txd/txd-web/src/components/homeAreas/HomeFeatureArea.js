import React from 'react';
import { Typography } from 'antd';
import HomeRowArea from "./HomeRowArea";
import styled from 'styled-components';
import { BulbOutlined, DollarCircleOutlined } from '@ant-design/icons';
import { MailOutlined, PhoneOutlined, WechatOutlined } from '@ant-design/icons';
import { Trans } from 'react-i18next';


const SubTitle = styled(Typography.Title)`
color: #f0f0f0 !important;
`

const InfoCard = styled.div`
box-sizing: border-box;
width: 100%;
margin-bottom: 2rem;

a {
  color: #f0f0f0;

  &:hover {
    color: white;
    text-decoration: underline;
  }
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
          <section>
            <table style={{ textAlign: 'left', margin: 'auto' }}>
              <tbody>
                <tr>
                  <td style={{ width: '5rem', textAlign: 'right', paddingRight: '8px' }}><MailOutlined /> <Trans i18nKey="home.contact.email" /></td>
                  <td><a href="mailto:mr.shaojun@gmail.com">mr.shaojun@gmail.com</a></td>
                </tr>
                <tr>
                  <td style={{ width: '5rem', textAlign: 'right', paddingRight: '8px' }}><PhoneOutlined /> <Trans i18nKey="home.contact.phone" /></td>
                  <td>0405581228</td>
                </tr>
                <tr>
                  <td style={{ width: '5rem', textAlign: 'right', paddingRight: '8px' }}><WechatOutlined /> <Trans i18nKey="home.contact.wechat" /></td>
                  <td>superopengl</td>
                </tr>
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', padding: '4px' }}><img src="images/wechat_logo_qr.jpg" alt="wechat account: superopengl" width={160} height="auto" /></td>
                </tr>
              </tbody>
            </table>
          </section>

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
