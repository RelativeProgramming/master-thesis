import { component } from '../framework';
import { Model2 } from './component2.model';

export { Component2 as C2}

@component
class Component2 {

    constructor(private model: Model2) {
    }

    render(): void {
        console.log("Rendering Component2");
        this.model.print("a");
        this.model.print("b");
    }
}

