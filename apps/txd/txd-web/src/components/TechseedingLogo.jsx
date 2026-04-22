import React from 'react';
import styled from 'styled-components';
import TechseedingLogoSvg from 'images/techseeding.svg?react';

const Container = styled.div`
  position: relative;
  top: 10px;
  left: -20px;
`;

export const TechseedingLogo = () => (
  <Container>
    <TechseedingLogoSvg />
  </Container>
);

export default TechseedingLogo;
