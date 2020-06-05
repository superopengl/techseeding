import React from 'react';
import PropTypes from 'prop-types';
import { Card, Typography } from 'antd';
import styled from 'styled-components';
import { getImageUrl } from 'util/getImageUrl';
import { LinkOutlined, DownOutlined } from '@ant-design/icons';
const { Meta } = Card;
const { Paragraph } = Typography;

const CardStyled = styled(Card)`
  width: 100%;
  height: 450px;
  margin-bottom: 1rem;
  text-align: center;
`;

const MetaStyled = styled(Meta)`
  text-align: center;
`;

const CoverImageStyled = styled.div`
  width: 100%;
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
        <MetaStyled title={title} description={<Paragraph ellipsis={{ rows: 5, expandable: false}}>{description}</Paragraph>} />
        {website && <small><a target="_blank" rel="noopener noreferrer" href={website}><LinkOutlined /> Link</a></small>}
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
