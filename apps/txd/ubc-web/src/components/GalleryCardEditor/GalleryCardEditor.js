import React from 'react';
import PropTypes from 'prop-types';
import ImageCardEditor from 'components/ImageCardEditor/ImageCardEditor';
import { GalleryDef } from 'formDefs/GalleryDef';
import {
  HomeOutlined,
  SettingFilled,
  SmileOutlined,
  SyncOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';
import { Button, message } from 'antd';

export class GalleryCardEditor extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    return (
      <ImageCardEditor
        id="33d2b054-1410-4a13-8294-f95ae2ac9f8d"
        cardWidth="240px"
        fieldDefs={GalleryDef}
        onFetch={id => getGallery(id)}
        onSave={data => saveGallery(data)}
        onDelete={id => deleteGallery(id)}
      />
    );
  }
};

GalleryCardEditor.propTypes = {};

GalleryCardEditor.defaultProps = {};

export default GalleryCardEditor;
