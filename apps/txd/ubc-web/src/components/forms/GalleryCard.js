import React from 'react';
import PropTypes from 'prop-types';
import { Card, Modal } from 'antd';
import styled from 'styled-components';
import Lightbox from 'react-image-lightbox';
import { getImageUrl } from 'util/getImageUrl';
const { Meta } = Card;


const MetaStyled = styled(Meta)`
  text-align: center;
`;

const CoverImageStyled = styled.div`
width: 100%;
height: 300px;
overflow: hidden;
background-repeat: no-repeat;
background-size: contain;
background-position: center;
border-bottom: 1px solid #f0f0f0;

&:hover {
  cursor: pointer;
}
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
