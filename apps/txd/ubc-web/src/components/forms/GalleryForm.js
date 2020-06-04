import React from 'react';
import ImageCardForm from 'components/forms/ImageCardForm';
import { GalleryDef } from 'components/forms/formDefs/GalleryDef';
import { getGallery, saveGallery } from 'services/galleryService';

export class GalleryForm extends React.Component {


  handleSave = async (data) => {
    await saveGallery(data);
    this.props.onFinish();
  }

  render() {
    return (
      <ImageCardForm
        fieldDefs={GalleryDef}
        onFetch={id => getGallery(id)}
        onSave={this.handleSave}
        onCancel={this.props.onCancel}
        {...this.props}
      />
    );
  }
};

GalleryForm.propTypes = {};

GalleryForm.defaultProps = {};

export default GalleryForm;
