import { component } from '../framework';
import { Model1 } from './component1.model';

@component
export class Component1 {

    constructor(private model: Model1) {
    }

    render(): void {
        console.log("Rendering Component1");
        this.model.print("x");
        this.model.print("y");
    }
}