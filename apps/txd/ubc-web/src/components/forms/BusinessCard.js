import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';
import styled from 'styled-components';
import { getImageUrl } from 'util/getImageUrl';
const { Meta } = Card;


const CardStyled = styled(Card)`
  width: 240px;
  height: 360px;
  margin-bottom: 2rem;
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

export class BusinessCard extends React.Component {


  render() {
    const { title, description, imageId, website } = this.props.data;

    return (
      <CardStyled
        hoverable
        cover={<CoverImageStyled style={{ backgroundImage: `url("${getImageUrl(imageId)}")` }} />}
      >
        <MetaStyled title={title} description={description} />
        {website && <div style={{ marginTop: '1rem' }}>
          <a target="_blank" rel="noopener noreferrer" href={website}>Website</a>
        </div>}
      </CardStyled>
    );
  }
}

BusinessCard.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    website: PropTypes.string,
    imageId: PropTypes.string.isRequired
  })
};

BusinessCard.defaultProps = {};

export default BusinessCard;
