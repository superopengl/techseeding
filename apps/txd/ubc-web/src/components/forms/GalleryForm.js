import React from 'react';
import ImageCardForm from 'components/forms/ImageCardForm';
import { GalleryDef } from 'formDefs/GalleryDef';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';

export class GalleryForm extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ImageCardForm
        id={this.props.id}
        readWidth={240}
        editWidth={480}
        fieldDefs={GalleryDef}
        onFetch={id => getGallery(id)}
        onSave={data => saveGallery(data)}
        onDelete={id => deleteGallery(id)}
      />
    );
  }
};

GalleryForm.propTypes = {};

GalleryForm.defaultProps = {};

export default GalleryForm;
