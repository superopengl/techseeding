import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
color: rgba(255,255,255,0.7);
display: flex;

&:hover {
  color: white;
}
`;

function LangToggleButton({ onClick }) {
  return (
    <Container onClick={onClick}>
      English / 简体中文
    </Container>
  );
}

export default LangToggleButton;
