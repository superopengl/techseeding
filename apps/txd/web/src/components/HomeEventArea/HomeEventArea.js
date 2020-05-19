import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import { getVenderData } from '../../services/dataService';
import HomeEventCard from "../HomeEventCard/HomeEventCard";
import HomeRowArea from "../HomeRowArea/HomeRowArea";
import momentRandom from 'moment-random';
import moment from 'moment';
import styled from 'styled-components';

const { Meta } = Card;

const RowStyled = styled(Row)`
  max-width: 1024px;
  margin: 0 auto 0 auto;
`;


class HomeEventArea extends React.Component {
  constructor(props) {
    super(props);

    const now = moment();
    const start = now.add(1, 'week');
    const end = now.add(3, 'months');

    this.venderData = getVenderData().map((x, i) => Object.assign({}, x, {
      eventName: `${x.name} Event`,
      eventDate: momentRandom(end, start)
    })).slice(0, 12);
  }

  render() {
    return (
      <HomeRowArea title="Upcoming Events" bgColor="#f5f5f5">
        <RowStyled>
          {this.venderData.map(f => (
            <Col key={f.file} span={6}>
              <HomeEventCard data={f}>
              </HomeEventCard>
            </Col>
          ))}
        </RowStyled>
      </HomeRowArea>
    );
  }
}

HomeEventArea.propTypes = {};

HomeEventArea.defaultProps = {};

export default HomeEventArea;
