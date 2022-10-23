import {
  BODY,
  CONTROLLERS,
  CONTROLLER_PATH,
  HttpMethods,
  INJECTABLE_SIGNATURE,
  PROVIDERS,
  ROUTES,
} from './constants';
import { ModuleMetadata } from './types';
import 'reflect-metadata';
const { GET, POST, PUT, PATCH, DELETE } = HttpMethods;

export function Controller(name?: string) {
  return function (self: Function) {
    Reflect.defineMetadata(CONTROLLER_PATH, name, self.prototype);
  };
}
export function Get(path: string) {
  return function (self: any, method: string, descriptor: PropertyDescriptor) {
    const routes = Reflect.getOwnMetadata(ROUTES, self) ?? [];
    Reflect.defineMetadata(
      ROUTES,
      [{ path, method, httpMethod: GET }, ...routes],
      self
    );
  };
}
export function Post(path: string) {
  return function (self: any, method: string, descriptor: PropertyDescriptor) {
    const routes = Reflect.getOwnMetadata(ROUTES, self) ?? [];
    Reflect.defineMetadata(
      ROUTES,
      [{ path, method, httpMethod: POST }, ...routes],
      self
    );
  };
}
export function Param(name: string | symbol) {
  return function (
    self: Object,
    method: string | symbol,
    parameterIndex: number
  ) {
    const parameters = Reflect.getOwnMetadata(method, self) ?? {};
    parameters[parameterIndex] = name;
    Reflect.defineMetadata(method, parameters, self);
  };
}
export function Body() {
  return Param(BODY);
}

export function Module(moduleMetadata: ModuleMetadata) {
  return function (self: Function) {
    for (const prop in moduleMetadata) {
      const propSymbol = (() => {
        if (prop === 'controllers') return CONTROLLERS;
        if (prop === 'providers') return PROVIDERS;
      })();
      if (moduleMetadata.hasOwnProperty(prop)) {
        Reflect.defineMetadata(
          propSymbol,
          moduleMetadata[prop as keyof ModuleMetadata],
          self
        );
      }
    }
  };
}

export function Injectable() {
  return function (constructor: Function) {
    Reflect.defineMetadata(INJECTABLE_SIGNATURE, true, constructor);
  };
}
