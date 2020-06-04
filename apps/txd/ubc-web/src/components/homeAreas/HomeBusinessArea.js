import React from 'react';
import PropTypes from 'prop-types';
import BusinessCard from "../forms/BusinessCard";
import HomeRowArea from "./HomeRowArea";
import { listBusiness } from 'services/businessService';


class HomeBusinessArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      list: undefined
    }
  }
  async componentDidMount() {
    const list = await listBusiness(this.props.group);
    this.setState({
      list
    });
  }

  render() {
    const { list } = this.state;
    if (!list || !list.length) return null;
    return (
      <HomeRowArea {...this.props}>
        {list && list.map((f, i) => <BusinessCard key={i} data={f} />)}
      </HomeRowArea>
    );
  }
}

HomeBusinessArea.propTypes = {
  group: PropTypes.string.isRequired,
};

HomeBusinessArea.defaultProps = {};

export default HomeBusinessArea;
