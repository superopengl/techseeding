import React from 'react';
import { listGallery, deleteGallery } from 'services/galleryService';
import GalleryForm from 'components/forms/GalleryForm';
import GenericAdminGrid from 'components/grids/GenericAdminGrid';


export const GalleryAdminGrid = () => (
  <GenericAdminGrid
    name="gallery picture"
    onLoadList={listGallery}
    onDelete={deleteGallery}
    cardEditorComponent={GalleryForm}
  />
);

GalleryAdminGrid.propTypes = {};

GalleryAdminGrid.defaultProps = {};

export default GalleryAdminGrid;
