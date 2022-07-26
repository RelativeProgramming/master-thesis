import React, { Component } from 'react';

import { GenericComponent } from '@leanup/lib';

import { MeasuredSerieModel } from '../../../models/measured-series.model';
import { ListSerieController } from './controller';

export class ListSerieComponent extends Component<unknown, unknown> implements GenericComponent {
  public readonly ctrl: ListSerieController;

  public constructor(props: unknown) {
    super(props);
    this.ctrl = new ListSerieController({
      hooks: {
        doRender: this.forceUpdate.bind(this),
      },
    });
  }

  public render(): JSX.Element {
    const tables: any[] = [];
    for (let i = 0; i < this.ctrl.elements.length; i++) {
      tables.push(
        <table key={i}>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">ID</th>
              <th scope="col">Title</th>
              <th scope="col">Unit</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {this.ctrl.measuredSeries.map((serie: MeasuredSerieModel, index: number) => {
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{serie.getId()}</td>
                  <td>{serie.getTitle()}</td>
                  <td>{serie.getUnit()}</td>
                  <td>
                    <button
                      id={`edit-${index}`}
                      type="button"
                      onClick={() => {
                        this.ctrl.edit(serie);
                        this.forceUpdate();
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }
    return (
      <div>
        <h2>List</h2>
        <div>
          <button
            className="primary"
            id="add"
            type="button"
            onClick={() => {
              this.ctrl.add();
            }}
          >
            Add
          </button>
          {this.ctrl.showPerformanceButton && (
            <button
              className="secondary"
              id="start"
              type="button"
              onClick={() => {
                this.ctrl.onStart();
              }}
            >
              Performance
            </button>
          )}
        </div>
        {tables}
        <small>Duration: {this.ctrl.duration} ms</small>
      </div>
    );
  }
}
