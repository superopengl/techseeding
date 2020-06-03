import React from 'react';
import PropTypes from 'prop-types';
import { Radio } from 'antd';

export class RadioInput extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { value, onChange, options } = this.props;
    return (
      <Radio.Group defaultValue={value} buttonStyle="solid" onChange={e => onChange(e.target.value)}>
        <Radio.Button value="a">Hangzhou</Radio.Button>
        <Radio.Button value="b">Shanghai</Radio.Button>
        <Radio.Button value="c">Beijing</Radio.Button>
        <Radio.Button value="d">Chengdu</Radio.Button>
        {options.map((opt, i) => (
          <Radio.Button key={i} value={opt.value}>{opt.label}</Radio.Button>
        ))}
      </Radio.Group>
    );
  }
}

RadioInput.propTypes = {};

RadioInput.defaultProps = {};

export default RadioInput;
