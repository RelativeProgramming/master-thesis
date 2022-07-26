import React, { Component } from 'react';

import { GenericComponent } from '@leanup/lib';

import IMG_LEANUP from '../../assets/logo.leanupjs.png';
import IMG_FRAMEWORK from '../../assets/logo.react.png';
import { RouterService } from '../../services/router/service';
import { Filters } from '../../shares/filters';
import { CreateSerieComponent } from '../series/create/component.react';
import { EditSerieComponent } from '../series/edit/component.react';
import { ListSerieComponent } from '../series/list/component.react';
import { AppController, ResolvedRoute } from './controller';

export class AppComponent extends Component<unknown, AppController> implements GenericComponent {
  private resolvedRoute: ResolvedRoute = {
    url: 'series',
  };

  public readonly ctrl: AppController;

  public constructor(props: unknown) {
    super(props);
    this.ctrl = new AppController({
      hooks: {
        doRender: this.forceUpdate.bind(this),
      },
    });
    RouterService.subscribe(
      (
        route: {
          url: string;
        },
        data: {
          id: string;
        }
      ) => {
        this.resolvedRoute = {
          data,
          url: route.url,
        };
        this.forceUpdate();
      }
    );
  }

  public render(): JSX.Element {
    return (
      <div className="my-app">
        <div className="grid grid-cols-3 items-center">
          <a href="https://reactjs.org/" target="reactjs" className="text-center">
            <img src={IMG_FRAMEWORK as string} alt="React Framework" className="m-auto h-24" />
          </a>
          <div className="text-center text-5xl text-gray-400 font-extrabold">+</div>
          <a href="https://leanupjs.org" target="leanupjs" className="text-center">
            <img src={IMG_LEANUP as string} alt="Leanup Stack" className="m-auto h-24" />
          </a>
        </div>
        <h1>
          {this.ctrl.framework.name} v{this.ctrl.framework.version}
        </h1>
        <small>{this.ctrl.finishedRendering} ms upcomming time</small>
        {this.resolvedRoute.url === 'series' && <ListSerieComponent />}
        {this.resolvedRoute.url === 'series/create' && <CreateSerieComponent />}
        {this.resolvedRoute.url === 'series/:id/edit' && <EditSerieComponent resolvedRoute={this.resolvedRoute} />}
        <small>
          Used filters: {Filters.date(this.ctrl.dummies.date)} | {Filters.currency(this.ctrl.dummies.price)} €
        </small>
        <br />
        <small>
          Build with: {this.ctrl.cli.name} v{this.ctrl.cli.version}
        </small>
      </div>
    );
  }
}
