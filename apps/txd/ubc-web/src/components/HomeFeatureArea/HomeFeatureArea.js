import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import HomeRowArea from "../HomeRowArea/HomeRowArea";
import HomeFeatureCard from "../HomeFeatureCard/HomeFeatureCard";
import styled from 'styled-components';
import { BulbOutlined, DollarCircleOutlined, RocketOutlined, AudioOutlined } from '@ant-design/icons';
import { MailOutlined, PhoneOutlined, GlobalOutlined, WechatOutlined } from '@ant-design/icons';

const RowStyled = styled(Row)`
  max-width: 1024px;
  margin: 0 auto 0 auto;
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
    return (
      <HomeRowArea bgColor={this.props.bgColor}>
        <RowStyled>
          {/* {this.data.map((f, i) => (
            <Col key={i} span={12}>
              <HomeFeatureCard icon={f.icon} content={f.content}>
              </HomeFeatureCard>
            </Col>
          ))} */}
          <Col span={12}>
            <h2>About Us</h2>
            <p>We are UBC. We are UBC. We are UBC. We are UBC. We are UBC. We are UBC. We are UBC. We are UBC. </p>
          </Col>
          <Col span={12}>
            <h2>Contact</h2>
            <p>
              <MailOutlined /> Email      :  abc@google.com
        </p>
            <p>
              <PhoneOutlined /> Phone     :  02012345678
        </p>
            <p>
              <WechatOutlined /> WeChat   :  helloWeChat
        </p>
            <p>
              <GlobalOutlined /> Address  :  456 Sydney Street, Sydney, NSW 2000
        </p>
          </Col>
        </RowStyled>
      </HomeRowArea>
    );
  }
}

HomeFeatureArea.propTypes = {};

HomeFeatureArea.defaultProps = {};

export default HomeFeatureArea;
