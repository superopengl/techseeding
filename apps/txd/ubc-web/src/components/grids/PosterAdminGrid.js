import React from 'react';
import PropTypes from 'prop-types';
import GenericAdminGrid from 'components/grids/GenericAdminGrid';
import { deletePoster, listPoster } from 'services/posterService';
import PosterForm from 'components/forms/PosterForm';


export const PosterAdminGrid = () => (
  <GenericAdminGrid 
    name="poster"
    onLoadList={listPoster}
    onDelete={deletePoster}
    cardEditorComponent={PosterForm}
  />
);

PosterAdminGrid.propTypes = {};

PosterAdminGrid.defaultProps = {};

export default PosterAdminGrid;
