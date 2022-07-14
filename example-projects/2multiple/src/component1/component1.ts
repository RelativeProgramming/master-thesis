import { DepC } from '../component2/component2';
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

export const myConst = 1;

export interface ImplementMe {
    implProp: number;
    implMethod(a: number): void;
}

const c = new DepC();
const c1 = c.b.a;