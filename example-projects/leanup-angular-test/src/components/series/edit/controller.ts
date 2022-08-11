import { InputControl } from '@leanup/form';
import { AbstractController, DI } from '@leanup/lib';

import { MeasuredSerieModel } from '../../../models/measured-series.model';
import { MeasurementService } from '../../../services/measurements/service';
import { RouterService } from '../../../services/router/service';
import { EditorForm } from '../editor/editor.form';

export class EditSerieController extends AbstractController {
  private readonly measurementService: MeasurementService = DI.get('MeasurementService');
  public editorForm: EditorForm = new EditorForm('edit');
  private measuredSerie: MeasuredSerieModel = new MeasuredSerieModel('', '');

  public changeMeasuredSerie(measuredSerieId: number): void {
    try {
      this.measuredSerie = this.measurementService.getSerie(measuredSerieId);
    } catch (error) {
      this.measuredSerie = new MeasuredSerieModel('', '');
    }
    this.updateProps(this.measuredSerie);
  }

  public updateProps(measuredSerie: MeasuredSerieModel): void {
    if (measuredSerie instanceof MeasuredSerieModel) {
      this.measuredSerie = measuredSerie;
      this.mapTo(measuredSerie);
    }
  }

  public mapTo(measuredSerie: MeasuredSerieModel): void {
    if (measuredSerie instanceof MeasuredSerieModel) {
      this.editorForm = new EditorForm('edit');
      const title = <InputControl>this.editorForm.getControl('title');
      const unit = <InputControl>this.editorForm.getControl('unit');
      title.value = this.measuredSerie.getTitle();
      unit.value = this.measuredSerie.getUnit();
    }
  }

  public onDelete(): void {
    if (this.measuredSerie instanceof MeasuredSerieModel) {
      this.measurementService.removeSerie(this.measuredSerie);
      this.onCancel();
    }
  }

  public onSubmit(): void {
    if (this.measuredSerie instanceof MeasuredSerieModel && this.editorForm instanceof EditorForm) {
      const title = <InputControl>this.editorForm.getControl('title');
      const unit = <InputControl>this.editorForm.getControl('unit');
      this.measuredSerie.setTitle(<string>title.value);
      this.measuredSerie.setUnit(<string>unit.value);
      this.measurementService.store();
      this.onCancel();
    }
  }

  public onCancel(): void {
    RouterService.navigate('series');
  }
}
