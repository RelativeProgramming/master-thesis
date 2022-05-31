import { component } from '../framework';
import { Model2 } from './component2.model';

export { Component2 as C2}

@component
class Component2 {

    _a: string = "";
    // myProp: Model2 = new Model2();
    // myProp2: TestInterface = {x: 0, y: 1};
    // myProp3: TestType = 3;
    //myProp4: {x: string} = {x: ""};
    //myPropFunc: <T extends {a: number}>(x: T[]) => T = (x) => x[0];
    // myProp5: string[] | Array<number> | Map<number, string> | Function = [""];

    constructor(private model: Model2) {
    } 

    render(): void {
        console.log("Rendering Component2");
        this.model.print("a");
        this.model.print("b");
    }

    myFuncTest<T>(myParam1: number, myParam2: string[]): T[] {
        return [];
    }

    set a(value: number | string) {
        this._a = ""+value;
    }

    get a(): string {
        return this._a;
    }

    #myJSPrivateFunc() : void {}
}

interface TestInterface {
    x: string;
}

type TestType = TestInterface | number;