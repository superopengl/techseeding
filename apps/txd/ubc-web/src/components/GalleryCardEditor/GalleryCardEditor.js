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
import { Button, message } from 'antd';

export class GalleryCardEditor extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    return (
      <ImageCardEditor
        fieldDefs={GalleryDef}
        onFetch={id => getGallery(id)}
        onSave={data => saveGallery(data)}
      />
    );
  }
};

GalleryCardEditor.propTypes = {};

GalleryCardEditor.defaultProps = {};

export default GalleryCardEditor;
