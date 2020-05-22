import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import HomeRowArea from "../HomeRowArea/HomeRowArea";
import HomeFeatureCard from "../HomeFeatureCard/HomeFeatureCard";
import styled from 'styled-components';
import { BulbOutlined, DollarCircleOutlined, RocketOutlined, AudioOutlined } from '@ant-design/icons';

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
      {
        icon: <RocketOutlined />,
        content: 'Create a list of the features of your services and then list how they transfer to benefits. A benefit might be something that you help customers achieve, or something negative that you can help them avoid. In other words, how is your service going to make the customer feel, or what are they going to gain? Think about how your service makes their life better, easier, more cost-efficient or more enjoyable and use these ideas to make your text more enticing.'
      }
    ];
  }
  render() {
    return (
      <HomeRowArea  color="#ffffff">
        <RowStyled>
          {this.data.map((f, i) => (
            <Col key={i} span={8}>
              <HomeFeatureCard icon={f.icon} content={f.content}>
              </HomeFeatureCard>
            </Col>
          ))}
        </RowStyled>
      </HomeRowArea>
    );
  }
}

HomeFeatureArea.propTypes = {};

HomeFeatureArea.defaultProps = {};

export default HomeFeatureArea;
