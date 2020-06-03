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
import { getGallery, saveGallery } from 'services/galleryService';

export class GalleryCardEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.id,
      loading: false
    }
  }

  componentDidMount() {
    const { id } = this.state;
    if (id) {
      this.loadEntity(id);
    }
  }

  onChange = async gallery => {
    this.setState({ loading: true });
    await saveGallery(gallery);
    this.setState({ loading: false });
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
