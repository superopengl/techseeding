import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import HomeRowArea from "./HomeRowArea";
import HomeFeatureCard from "../forms/HomeFeatureCard";
import styled from 'styled-components';
import { BulbOutlined, DollarCircleOutlined, HomeOutlined, AudioOutlined } from '@ant-design/icons';
import { MailOutlined, PhoneOutlined, GlobalOutlined, WechatOutlined } from '@ant-design/icons';

const RowStyled = styled(Row)`
  width: 100%;
  margin: 0 auto 0 auto;
`;

const SubTitle = styled.h2`
color: #f0f0f0;
`

const InfoCard = styled.div`
box-sizing: border-box;
width: 100%;
margin-bottom: 2rem;
`;

class HomeFeatureArea extends React.Component {
  constructor(props) {
    super(props);
    this.data = [
      {
        icon: <BulbOutlined />,
        content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      },
      {
        icon: <DollarCircleOutlined />,
        content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      },
      // {
      //   icon: <RocketOutlined />,
      //   content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      // }
    ];
  }


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
        backgroundColor: '#0f3566',
        color: '#f0f0f0'
      }
    }

    return (
      <HomeRowArea {...props}>
        <InfoCard>
          <SubTitle>About Us</SubTitle>
          <section>
            A disclaimer is a notice which is placed on your website in an effort to limit your liability for the outcome of the use of your site. Even if you haven't thought much about them previously, you have certainly seen disclaimers all over the web. Nearly every website has one in place, and you should as well.
        </section>
        </InfoCard>
        <InfoCard>
          <SubTitle>Contact</SubTitle>
          <section>

            <p>
              <MailOutlined style={{ marginRight: 8 }} />abc@google.com
        </p>
            <p>
              <PhoneOutlined style={{ marginRight: 8 }} />02012345678
        </p>
            <p>
              <WechatOutlined style={{ marginRight: 8 }} />helloWeChat
        </p>
            <p>
              <HomeOutlined style={{ marginRight: 8 }} />456 Sydney Street, Sydney, NSW 2000
        </p>
          </section>

        </InfoCard>
        <InfoCard>
          <SubTitle>Disclaimer</SubTitle>
          <section>
            A disclaimer is a notice which is placed on your website in an effort to limit your liability for the outcome of the use of your site. Even if you haven't thought much about them previously, you have certainly seen disclaimers all over the web. Nearly every website has one in place, and you should as well.
        </section>
        </InfoCard>
      </HomeRowArea>
    );
  }
}

HomeFeatureArea.propTypes = {};

HomeFeatureArea.defaultProps = {};

export default HomeFeatureArea;
