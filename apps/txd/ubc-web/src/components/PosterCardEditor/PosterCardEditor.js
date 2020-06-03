import React from 'react';
import ImageCardEditor from 'components/ImageCardEditor/ImageCardEditor';
import { GalleryDef } from 'formDefs/GalleryDef';
import { getGallery, saveGallery, deleteGallery } from 'services/galleryService';
import { PosterDef } from 'formDefs/PosterDef';
import { getPoster, savePoster, deletePoster } from 'services/posterService';

export class PosterCardEditor extends React.Component {
  constructor(props) {
    super(props);

    console.log('parent', props);
  }

  onSave = async (data) => {
    await savePoster(data);
    this.props.onFinish();
  }

  onDelete = async (id) => {
    console.log('delete poster', id);
    await deletePoster(id);
    this.props.onFinish();
  }

  render() {
    return (
      <ImageCardEditor
        readWidth={240}
        editWidth={480}
        fieldDefs={PosterDef}
        onFetch={id => getPoster(id)}
        onSave={this.onSave}
        onDelete={this.onDelete}
        {...this.props}
      />
    );
  }
};

PosterCardEditor.propTypes = {};

PosterCardEditor.defaultProps = {};

export default PosterCardEditor;
