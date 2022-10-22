import { Server, createServer, IncomingMessage, ServerResponse } from 'node:http';
import { INJECTABLE_SIGNATURE } from './symbols';
import { AnyClass } from './types';

const globalMap = new Map([
          ['GET', new Map()],
          ['POST', new Map()], 
          ['PUT', new Map()], 
          ['PATCH', new Map()], 
          ['DELETE', new Map()]
        ]);

export class NestFactory {
  static create(module:AnyClass):Server {
    const providers = Reflect.getOwnMetadata('providers', module);
    const controllers = Reflect.getOwnMetadata('controllers', module);

    for (const controller of controllers) {
      let bound = controller;
      const paramTypes = Reflect.getMetadata('design:paramtypes', controller);
      for (const paramType of paramTypes) {
        for (const provider of providers) {
          if (Reflect.getOwnMetadata(INJECTABLE_SIGNATURE, provider)) {
            if (paramType === provider) {
              bound = bound.bind(null, new provider());
              break;
            }
            if (paramType === Object.getPrototypeOf(provider)) {
              bound = bound.bind(null, provider);
              break;
            }
          }

          throw new Error('not injectable or provider not found');
        }
      }
      
      void function () {
        const controllerPath = Reflect.getOwnMetadata('controllerPath', controller.prototype);
        const metadataKeys = Reflect.getOwnMetadataKeys(controller.prototype);
        const boundInstance = new bound();

        metadataKeys.forEach((key) => {
          if (key !== 'controllerPath') {
            const { method, httpMethod } = Reflect.getOwnMetadata(key, controller.prototype);
            const handler = boundInstance[method];
            // 정규표현식으로 바꿔야함
            globalMap.get(httpMethod)?.set(controllerPath + key, handler);
          }
        })
      }();
 
      console.log(globalMap)
    }


    const server = createServer((req, res) => {
      void function (req:IncomingMessage, res:ServerResponse) {
        const methodHandlers = globalMap.get(req.method ?? 'GET');
        // 정규표현식으로 메서드 매칭
        // 매칭된 메서드를 호출할 때 그 인자는 어떻게?
      }(req, res)
    });

    return server;
  }
}