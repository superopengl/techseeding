import React from 'react';
import styled from 'styled-components';
import { Row, Col } from 'antd';

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  color: '#383838';
`;

const Container = styled.div`
justify-content: center;
margin-bottom: 0rem;
width: 100%;
text-align: center;
padding: 2rem 0;
`;

const InnerContainer = styled.div`
margin-left: auto;
margin-right: auto;
width: 100%;
max-width: 1600px;
`;

const StyledRow = styled(Row)`
padding: 0 1rem;
`;

const defaultSpan = {
  xs: 24,
  sm: 12,
  md: 12,
  lg: 8,
  xl: 6,
  xxl: 4
};

function HomeRowArea({ title, style, bgColor, children, span = defaultSpan }) {
  const renderChildComponent = (comp) => (
    <Col {...span} key={comp.key}>
      {comp}
    </Col>
  );

  return (
    <Container style={{ backgroundColor: bgColor || '#fff', ...style }}>
      <InnerContainer>
        <Row>
          <Col span={24}>
            {title && <Title>{title}</Title>}
          </Col>
        </Row>
        <StyledRow gutter={16}>
          {React.Children.map(children, renderChildComponent)}
        </StyledRow>
      </InnerContainer>
    </Container>
  );
}

export default HomeRowArea;
