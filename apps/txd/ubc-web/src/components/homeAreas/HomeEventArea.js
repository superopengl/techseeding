import React from 'react';
import HomeRowArea from "./HomeRowArea";
import { listEvent } from 'services/eventService';
import EventCard from 'components/forms/EventCard';

class HomeEventArea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      list: undefined
    }
  }

  async componentDidMount() {
    const list = await listEvent();
    this.setState({
      list
    });
  }

  render() {
    const { list } = this.state;
    if (!list || !list.length) return null;
    return (
      <HomeRowArea {...this.props}>
        {list && list.map((f, i) => <EventCard key={i} data={f} />)}
      </HomeRowArea>
    );
  }
}

HomeEventArea.propTypes = {};

HomeEventArea.defaultProps = {};

export default HomeEventArea;
