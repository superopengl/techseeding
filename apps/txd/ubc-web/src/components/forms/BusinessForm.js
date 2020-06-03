import React from 'react';
import ImageCardForm from 'components/forms/ImageCardForm';
import { BusinessDef } from 'formDefs/BusinessDef';
import { getBusiness, saveBusiness } from 'services/businessService';

export class BusinessForm extends React.Component {
  constructor(props) {
    super(props);
  }

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

BusinessForm.propTypes = {};

BusinessForm.defaultProps = {};

export default BusinessForm;
