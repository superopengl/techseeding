import React from 'react';
import ImageCardEditor from 'components/ImageCardEditor/ImageCardEditor';
import { GalleryDef } from 'formDefs/GalleryDef';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';
import { PosterDef } from 'formDefs/PosterDef';
import { getPoster, savePoster, deletePoster } from 'services/posterService';

export class PosterCardEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  handleFetch = id => {
    return getPoster(id);
  }

  handleSave = async (data) => {
    await savePoster(data);
    this.props.onFinish();
  }

  handleCancel = () => {
    this.props.onCancel();
  }

  render() {
    return (
      <ImageCardEditor
        fieldDefs={PosterDef}
        onFetch={this.handleFetch}
        onSave={this.handleSave}
        onCancel={this.handleCancel}
        {...this.props}
      />
    );
  }
};

PosterCardEditor.propTypes = {};

PosterCardEditor.defaultProps = {};

export default PosterCardEditor;
