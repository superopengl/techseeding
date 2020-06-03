import React from 'react';
import ImageCardForm from 'components/forms/ImageCardForm';
import { GalleryDef } from 'formDefs/GalleryDef';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';
import { PosterDef } from 'formDefs/PosterDef';
import { getPoster, savePoster, deletePoster } from 'services/posterService';

export class PosterForm extends React.Component {
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
      <ImageCardForm
        fieldDefs={PosterDef}
        onFetch={this.handleFetch}
        onSave={this.handleSave}
        onCancel={this.handleCancel}
        {...this.props}
      />
    );
  }
};

PosterForm.propTypes = {};

PosterForm.defaultProps = {};

export default PosterForm;
