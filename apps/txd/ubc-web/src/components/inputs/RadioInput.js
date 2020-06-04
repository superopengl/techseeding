import React from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';

export class RadioInput extends React.Component {

  render() {
    const { value, onChange, options } = this.props;
    return (
      <Radio.Group defaultValue={value} buttonStyle="solid" onChange={e => onChange(e.target.value)}>
        {options.map((opt, i) => (
          <Radio key={i} value={opt.value}>{opt.label}</Radio>
        ))}
      </Radio.Group>
    );
  }
}

RadioInput.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.exact({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ),
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired
};

RadioInput.defaultProps = {};

export default RadioInput;
