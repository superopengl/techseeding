import React from 'react';
import PropTypes from 'prop-types';
import { Card } from 'antd';
const { Meta } = Card;

export class PictureEditCard extends React.Component {
  constructor(props) {
    super(props);

  }
  render() {
    return (
      <div>
        <Card
          hoverable
          style={{ width: 240 }}
          cover={<img alt="example" src="https://os.alipayobjects.com/rmsportal/QBnOOoLaAfKPirc.png" />}
        >
          <Meta title="Europe Street beat" description="www.instagram.com" />
        </Card>
      </div>
    );
  }
}

PictureEditCard.propTypes = {};

PictureEditCard.defaultProps = {};

export default PictureEditCard;
