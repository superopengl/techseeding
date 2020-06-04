import React from 'react';
import { Row, Col, Button } from 'antd';
import BusinessCard from "../forms/BusinessCard";
import HomeRowArea from "./HomeRowArea";
import styled from 'styled-components';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { listEvent } from 'services/eventService';


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
      <HomeRowArea {...this.props}>
        <RowStyled>
          {list && list.map((f, i) => (
            <Col key={i} span={6}>
              <BusinessCard data={f}>
              </BusinessCard>
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
