import React from 'react';
import PropTypes from 'prop-types';
import HomeRowArea from '../HomeRowArea/HomeRowArea';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import styled from 'styled-components';
const { Option } = Select;

const HomeRowAreaStyled = styled(HomeRowArea)`
  max-width: 200px;
`;

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto 0 auto;
`;

class HomeMessageArea extends React.Component {
  // constructor(props){
  //   super(props);
  // }

  render() {
    return (
      <HomeRowAreaStyled title="Send Us A Message">
        <Container>
          <Input size="large" placeholder="Your Name" maxLength={50} />
          <br />
          <br />
          <Input size="large" placeholder="Your Email" maxLength={50} />
          <br />
          <br />
          <Input size="large" placeholder="Your Phone Number" maxLength={11} />
          <br />
          <br />
          <Select size="large" placeholder="Your Location" style={{ width: '100%', textAlign: 'left' }} >
            <Option value="brisbane">Brisbane</Option>
            <Option value="melbourne">Melbourne</Option>
            <Option value="sydney">Sydney</Option>
            <Option value="other">Other</Option>
          </Select>
          <br />
          <br />
          <Input.TextArea size="large" rows={4} placeholder="Write your comments here" />
          <br />
          <br />
          <Button type="primary" shape="round" size="large" style={{ width: '100%' }}>SEND</Button>
        </Container>
      </HomeRowAreaStyled>
    );
  }
}

HomeMessageArea.propTypes = {};

HomeMessageArea.defaultProps = {};

export default HomeMessageArea;
