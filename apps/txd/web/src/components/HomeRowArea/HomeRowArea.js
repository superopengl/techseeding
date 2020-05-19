import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  color: #383838;
`;

const RowStyled = styled(Row)`
  justify-content: center;
  margin-bottom: 0rem;
  width: 100%;
  text-align: center;
  padding: 2rem 0;
`;

export class HomeRowArea extends React.Component {
  render() {
    // const backgroundColor = this.props.theme === 'gray' ? '#eeeeee' : '#fff';
    const bgColor = this.props.bgColor || '#fff';
    return (
      <RowStyled style={{backgroundColor: bgColor}}>
        <Col span={24}>
          {this.props.title && <Title>{this.props.title}</Title>}
          <div>{this.props.children}</div>
        </Col>
      </RowStyled>
    );
  }
}

HomeRowArea.propTypes = {};

HomeRowArea.defaultProps = {};

export default HomeRowArea;
