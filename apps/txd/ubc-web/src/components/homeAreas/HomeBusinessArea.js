import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col, Button } from 'antd';
import BusinessCard from "../forms/BusinessCard";
import HomeRowArea from "./HomeRowArea";
import styled from 'styled-components';
import { DownOutlined, UpOutlined } from '@ant-design/icons';
import { listBusiness } from 'services/businessService';


const RowStyled = styled(Row)`
  max-width: 1024px;
  margin: 0 auto 0 auto;
`;


class HomeBusinessArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: false
    }
  }

  async componentDidMount() {
    const list = await listBusiness(this.props.group);
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

HomeBusinessArea.propTypes = {
  title: PropTypes.string.isRequired,
  group: PropTypes.string.isRequired,
  bgColor: PropTypes.string,
};

HomeBusinessArea.defaultProps = {};

export default HomeBusinessArea;
