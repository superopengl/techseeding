import React from 'react';
import PropTypes from 'prop-types';
import { listGallery } from 'services/galleryService';
import styled from 'styled-components';
import { Layout, Menu, Row, Col, Card, Input, Select, Button } from 'antd';
import HomeRowArea from "components/homeAreas/HomeRowArea";
import { getImageUrl } from 'util/getImageUrl';

const RowStyled = styled(Row)`
  max-width: 1024px;
  margin: 0 auto 0 auto;
`;

const ImageStyled = styled.img`
  width: 100%;
  height: 100%;
`;

export class HomeGalleryArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  
  componentDidMount(){
    this.loadList();
  }

  async loadList(){
    const list = await listGallery();
    this.setState({
      list
    })
  }

  render() {
    const {list} = this.state;
    return (
      <HomeRowArea title="Gallery" bgColor={this.props.bgColor}>
        <RowStyled>
          {list && list.map((item, i) => (
            <Col key={i} span={6}>
              <ImageStyled src={getImageUrl(item.imageId)} alt={item.title}>
              </ImageStyled>
            </Col>
          ))}
        </RowStyled>
      </HomeRowArea>
    );
  }
}

HomeGalleryArea.propTypes = {};

HomeGalleryArea.defaultProps = {};

export default HomeGalleryArea;
