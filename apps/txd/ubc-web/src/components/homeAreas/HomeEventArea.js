import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import HomeEventCard from "../forms/HomeEventCard/HomeEventCard";
import HomeRowArea from "./HomeRowArea";
import momentRandom from 'moment-random';
import moment from 'moment';
import styled from 'styled-components';
import _ from 'lodash';
import { DownOutlined, UpOutlined, SmileOutlined, AudioOutlined } from '@ant-design/icons';
import { listBusiness } from 'services/businessService';
import { listEvent } from 'services/eventService';

const { Meta } = Card;

const RowStyled = styled(Row)`
  max-width: 1024px;
  margin: 0 auto 0 auto;
`;


class HomeEventArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false
    }
  }

  async componentDidMount() {
    const list = await listEvent();
    this.setState({
      list
    });
  }

  toggle = (value) => {
    this.setState({
      collapsed: value
    })
  }

  render() {
    const { list } = this.state;
    return (
      <HomeRowArea title={this.props.title} bgColor={this.props.bgColor}>
        <RowStyled>
          {list && list.map((f, i) => (
            <Col key={i} span={6}>
              <HomeEventCard data={f}>
              </HomeEventCard>
            </Col>
          ))}
        </RowStyled>
        <RowStyled style={{ justifyContent: 'center' }}>
          {!this.state.collapsed && <Button block style={{ color: '#8c8c8c' }} size="large" type="link" onClick={() => this.toggle(true)}><DownOutlined /></Button>}
          {this.state.collapsed && <Button block style={{ color: '#8c8c8c' }} size="large" type="link" onClick={() => this.toggle(false)}><UpOutlined /></Button>}
        </RowStyled>
      </HomeRowArea>
    );
  }
}

HomeEventArea.propTypes = {};

HomeEventArea.defaultProps = {};

export default HomeEventArea;
