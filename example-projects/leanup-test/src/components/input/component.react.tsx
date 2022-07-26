import React, { Component } from 'react';

import { InputControl } from '@leanup/form';

interface Props {
  control: InputControl;
}

export class InputComponent extends Component<Props, unknown> {
  public render(): JSX.Element {
    return (
      <div className="form-group">
        <label htmlFor={this.props.control.id}>{this.props.control.label}</label>
        <input
          className="form-control"
          id={this.props.control.id}
          name={this.props.control.name}
          value={this.props.control.value as string}
          onChange={(event) => {
            this.props.control.value = event.target === null ? '' : event.target.value;
            this.forceUpdate();
          }}
        />
      </div>
    );
  }
}
