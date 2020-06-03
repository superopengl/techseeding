import React from 'react';
import PropTypes from 'prop-types';
import ImageCardEditor from 'components/ImageCardEditor/ImageCardEditor';
import { GalleryDef } from 'defs/GalleryDef';
import {
  HomeOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { getGallery } from 'services/galleryService';

export class GalleryCardEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.id,
      loading: !!this.props.loading
    }
  }

  componentDidMount() {
    this.loadEntity(this.state.id);
  }

  onChange(values) {
    console.log('gallery', values);
  }

  async loadEntity(id) {
    this.setState({ loading: true });
    const data = await getGallery(id);
    this.setState({
      data,
      loading: false
    });
  }

  render() {
    const { loading, data } = this.state;

    return (
      <ImageCardEditor
        loading={loading}
        fieldDefs={GalleryDef}
        data={data}
        onChange={this.onChange} />
    );
  }
};

GalleryCardEditor.propTypes = {};

GalleryCardEditor.defaultProps = {};

export default GalleryCardEditor;
