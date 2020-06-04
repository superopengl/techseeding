import React from 'react';
import GenericAdminGrid from 'components/grids/GenericAdminGrid';
import { deleteBusiness, listBusiness } from 'services/businessService';
import BusinessForm from 'components/forms/BusinessForm';


export const BusinessAdminGrid = () => (
  <GenericAdminGrid 
    name="business"
    onLoadList={listBusiness}
    onDelete={deleteBusiness}
    cardEditorComponent={BusinessForm}
  />
);

BusinessAdminGrid.propTypes = {};

BusinessAdminGrid.defaultProps = {};

export default BusinessAdminGrid;
