import React from 'react';
import ImageCardEditor from 'components/ImageCardEditor/ImageCardEditor';
import { GalleryDef } from 'formDefs/GalleryDef';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';

export class GalleryCardEditor extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <ImageCardEditor
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

GalleryCardEditor.propTypes = {};

GalleryCardEditor.defaultProps = {};

export default GalleryCardEditor;
