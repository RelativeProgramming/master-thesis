import { component, required } from '../framework';
import { Model2 } from './component2.model';

export { Component2 as C2}

@component
class Component2 {

    _a: string = "";
    myProp: Model2 = new Model2();
    public myProp2: TestInterface = {x: 0, y: 1};
    protected myProp3: TestType = 3;
    private myProp4: {x: string} = {x: ""};
    myPropFunc: <T extends {a: number}>(x: T[]) => T = (x) => x[0];
    myProp5: string[] | Array<number> | Map<number, string> | Function = [""];
    readonly myProp6: Date = new Date();
    myProp7: "abc" | 42 = "abc";
    myProp8: [string, number] = ["a", 1];
    #mySuperPrivateProp: number = 10;

    constructor(protected readonly myProtectedReadonlyProp: number, private model?: Model2) {
    } 

    render(): void {
        console.log("Rendering Component2");
        this.model!.print("a");
        this.model!.print("b");
    }

    comp2Func(): void {

    }

    myFuncTest<T>(@required myParam1: number, myParam2: string[]): T[] {
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

class Component2Extended extends Component2 implements ImplementMe {

    newExtensionProp: TestInterfaceExtended = {x: 1, y: 2, z: 3, genericProp: "generic"};
    implProp: number = 42;

    constructor(public override myProp: Model2) {
        super(0);
    }

    override comp2Func(): void {
        super.comp2Func();
        console.log("Extended func");
    }

    override set a(value: string) {
        this._a = "impl:"+value;
    }

    otherFunc(x: number): number{
        return x + 1;
    }

    implMethod(a: number): void {
        console.log("doSth");
    }
}

class Class1<T> {

}

class Class2 extends Class1<string> {

}

interface GenericInterface<T> {
    genericProp: T;
}

interface TestInterface {
    x: number;
    y: number;
}

interface TestInterfaceExtended extends TestInterface, GenericInterface<string> {
    z: number;
}

interface ImplementMe {
    implProp: number;
    implMethod(a: number): void;
}

interface TestInterface2<T extends {a: number, b: string}> {
    interfaceProp1: T[];
    interFunc(x: number): string;
    set a(value: string);
    boolNum: true | false | number;
}

type TestType = TestInterface | number;