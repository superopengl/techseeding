import React from 'react';
import PropTypes from 'prop-types';

import HomeRowArea from "./HomeRowArea";

export class HomeAboutArea extends React.Component {

  render() {
    return (
      <HomeRowArea title={this.props.title} bgColor={this.props.bgColor}>
      <div>
        HomeAboutArea Component
      </div>
      </HomeRowArea>
    );
  }
}

HomeAboutArea.propTypes = {};

HomeAboutArea.defaultProps = {};

export default HomeAboutArea;
