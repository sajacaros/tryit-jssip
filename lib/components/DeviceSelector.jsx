import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

export default class DeviceSelector extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      
        <SelectField
          floatingLabelText={this.props.inputLabel}
          value={this.props.inputKey}
          fullWidth
          onChange={this.props.handleChangeDevice}
        >
          {this.props.input.map(d => {
            return (<MenuItem value={d.deviceId} key={d.deviceId} primaryText={d.label} />)
          })}
        </SelectField>
    )
  }
}

DeviceSelector.propTypes = {
  inputLabel: PropTypes.string.isRequired,
  inputKey: PropTypes.string.isRequired,
  handleChangeDevice: PropTypes.func.isRequired,
  input: PropTypes.array.isRequired,
};
