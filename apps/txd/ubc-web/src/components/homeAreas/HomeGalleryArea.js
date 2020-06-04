import React from 'react';
import PropTypes from 'prop-types';
import { listGallery } from 'services/galleryService';
import styled from 'styled-components';
import { Row, Col } from 'antd';
import HomeRowArea from "components/homeAreas/HomeRowArea";
import { getImageUrl } from 'util/getImageUrl';
import GalleryCard from 'components/forms/GalleryCard';

const ImageStyled = styled.img`
  width: 100%;
  height: 100%;
`;

export class HomeGalleryArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: undefined
    }
  }

  async componentDidMount() {
    const list = await listGallery();
    this.setState({
      list
    });
  }

  render() {
    const { list } = this.state;
    if (!list || !list.length) return null;
    return (
      <HomeRowArea {...this.props}>
        {list && list.map((f, i) => <GalleryCard key={i} data={f} />)}
      </HomeRowArea>
    );
  }
}

HomeGalleryArea.propTypes = {};

HomeGalleryArea.defaultProps = {};

export default HomeGalleryArea;
