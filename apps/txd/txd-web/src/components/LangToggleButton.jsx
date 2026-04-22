import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  color: rgba(255, 255, 255, 0.55);
  display: flex;
  font-size: 13px;
  letter-spacing: 0;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.9);
  }
`;

function LangToggleButton({ onClick }) {
  return (
    <Container onClick={onClick}>
      EN / 简中
    </Container>
  );
}

export default LangToggleButton;
