import React from 'react';
import PropTypes from 'prop-types';
import { Card, Modal } from 'antd';
import styled from 'styled-components';
import Lightbox from 'react-image-lightbox';
import { getImageUrl } from 'util/getImageUrl';
const { Meta } = Card;


const CardStyled = styled(Card)`
  width: 240px;
  height: 320px;
  margin-bottom: 1rem;
  text-align: center;

  &:hover {
    transform: scale(1.02);
  }
`;

const MetaStyled = styled(Meta)`
  text-align: center;
`;

const CoverImageStyled = styled.div`
width: 240px;
height: 200px;
overflow: hidden;
background-repeat: no-repeat;
background-size: contain;
background-position: center;
border-bottom: 1px solid #f0f0f0;
`;

const ImageStyled = styled.img`
  width: 100%;
  height: 100%;
`;

export class GalleryCard extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      previewing: false
    };
  }

  togglePreview = value => {
    this.setState({
      previewing: !this.state.previewing
    });
  }

  render() {
    const { title, description, imageId, website } = this.props.data;

    const imageUrl = getImageUrl(imageId);
    return (
      <div>
        <CoverImageStyled style={{ backgroundImage: `url("${imageUrl}")` }} onClick={() => this.setState({ previewing: true })} />
        {this.state.previewing && <Lightbox
          mainSrc={imageUrl}
          enableZoom={false}
          onCloseRequest={() => this.setState({ previewing: false })}
        />}
      </div>
    );
  }
}

GalleryCard.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    website: PropTypes.string,
    imageId: PropTypes.string.isRequired
  })
};

GalleryCard.defaultProps = {};

export default GalleryCard;
