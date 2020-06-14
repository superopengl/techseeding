import React from 'react';
import styled from 'styled-components';
import { ReactComponent as TechseedingLogoSvg } from 'images/techseeding.svg';

const Container = styled.div`
  // display: inline-block;
  // width: 100px;
  // height; 1rem;
  // border: 1px solid #ffffff;
  position: relative;
  top: 10px;
  left: -20px;
`;

export const TechseedingLogo = () => (
  <Container>
    <TechseedingLogoSvg/>
  </Container>
);

export default TechseedingLogo;
