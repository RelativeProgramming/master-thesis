import { typeIt } from '../../shares/utils';
import * as MOCK from './mock.json';

interface INameToValueMap {
  [key: string]: any;
}

const TYPED_MOCK = typeIt<INameToValueMap>(MOCK);

export class StorageService {
  private memoryStorage: INameToValueMap = {};
  private namespace: string;

  public constructor(namespace = 'app-store') {
    this.namespace = namespace;
    this.restore();
  }

  public setItem(key: string, value: unknown): void {
    this.memoryStorage[key] = value;
    this.store();
  }

  public getItem<T>(key: string): any {
    return <T>this.memoryStorage[key];
  }

  public removeItem(key: string): void {
    delete this.memoryStorage[key];
    this.store();
  }

  private restore(): void {
    try {
      const sessionStorage = window.sessionStorage.getItem(this.namespace);
      if (sessionStorage === null) {
        throw new Error('Session store is empty.');
      }
      this.memoryStorage = <Object>JSON.parse(sessionStorage);
    } catch (error) {
      this.memoryStorage = <Object>TYPED_MOCK;
    }
  }

  private store(): void {
    window.sessionStorage.setItem(this.namespace, JSON.stringify(this.memoryStorage));
  }
}
