import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Row, Col, Button } from 'antd';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  font-family: Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif;
  color: #383838;
`;

const CenterRowStyled = styled(Row)`
  justify-content: center;
  margin-bottom: 0rem;
  width: 100%;
  text-align: center;
  padding: 2rem 0;
`;

const ExpandButton = styled(Button)`
width: 100%;
color: #e2e2e2;
  & svg {
    transform: scaleX(3);
  }
`;

const CardRowStyled = styled(Row)`
  margin-bottom: 0rem;
  width: 100%;
  text-align: center;
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
max-width: 1024px;
`;

export class HomeRowArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      collapsed: true
    }
  }

  toggle = (value) => {
    this.setState({
      collapsed: value
    })
  }

  renderChildComponent = (child, index) => {
    const { colNum } = this.props;
    const { collapsed } = this.state;
    const colSpan = 24 / colNum;
    return collapsed && index >= colNum ? null : <Col span={colSpan}>{child}</Col>
  }

  render() {
    const { title, bgColor, children, colNum } = this.props;
    const totalRows = Math.ceil(children.length / colNum);

    return (
      <Container style={{ backgroundColor: bgColor || '#fff' }}>
        <InnerContainer>
          {/* <Col span={24}>
          {this.props.title && <Title>{this.props.title}</Title>}
          <div>{this.props.children}</div>
        </Col> */}
          {title && <CenterRowStyled><Title>{title}</Title></CenterRowStyled>}
          <CardRowStyled>
            {React.Children.map(children, this.renderChildComponent)}
          </CardRowStyled>
          {totalRows > 1 && <CenterRowStyled style={{ padding: 0 }}>
            {this.state.collapsed && <ExpandButton icon={<DownOutlined />} type="link" onClick={() => this.toggle(false)}/>}
            {!this.state.collapsed && <ExpandButton icon={<UpOutlined />} type="link" onClick={() => this.toggle(true)}/>}
          </CenterRowStyled>}
        </InnerContainer>
      </Container>

    );
  }
}

HomeRowArea.propTypes = {
  title: PropTypes.string,
  bgColor: PropTypes.string,
  colNum: PropTypes.number.isRequired
};

HomeRowArea.defaultProps = {
  colNum: 4
};

export default HomeRowArea;
