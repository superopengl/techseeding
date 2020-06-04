import React from 'react';
import PropTypes from 'prop-types';
import ImageCardForm from 'components/forms/ImageCardForm';
import { BusinessDef } from 'components/forms/formDefs/BusinessDef';
import { getBusiness, saveBusiness } from 'services/businessService';

export class BusinessForm extends React.Component {


  handleSave = async (data) => {
    await saveBusiness(data);
    this.props.onFinish();
  }

  render() {
    return (
      <ImageCardForm
        fieldDefs={BusinessDef}
        onFetch={id => getBusiness(id)}
        onSave={this.handleSave}
        onCancel={this.props.onCancel}
        {...this.props}
      />
    );
  }
};

BusinessForm.propTypes = {
  id: PropTypes.string,
  onFinish: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
};

BusinessForm.defaultProps = {};

export default BusinessForm;
