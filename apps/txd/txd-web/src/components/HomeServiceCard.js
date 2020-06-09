import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Typography } from 'antd';
import styled from 'styled-components';

const { Title } = Typography;

const StyledP = styled.p`

`;

const Container = styled.div`

`;

const HomeServiceCard = (props) => (
  <Container>
    <div>
      <Title>{props.title}</Title>
      <StyledP>{props.description}</StyledP>
    </div>
    <div>
      {props.image}
    </div>
  </Container>
);

HomeServiceCard.propTypes = {};

HomeServiceCard.defaultProps = {};

export default HomeServiceCard;
