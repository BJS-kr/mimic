import { Server, createServer } from 'node:http';
import {
  BODY,
  CONTROLLERS,
  CONTROLLER_PATH,
  INJECTABLE_SIGNATURE,
  ORIGINAL_PATH,
  PARAM_TYPES,
  PROVIDERS,
  ROUTES,
  HttpMethods,
} from './constants';
import { AnyClass, MasterArg, Params, Routes } from './types';
const { GET, POST, PUT, PATCH, DELETE } = HttpMethods;

export class MimicFactory {
  private static globalMap = new Map([
    [GET, new Map()],
    [POST, new Map()],
    [PUT, new Map()],
    [PATCH, new Map()],
    [DELETE, new Map()],
  ]);

  static create(module: AnyClass): Server {
    const providers = Reflect.getOwnMetadata(PROVIDERS, module);
    const controllers = Reflect.getOwnMetadata(CONTROLLERS, module);

    for (const controller of controllers) {
      const bound = this.makeContextBound(controller, providers);
      const controllerPath = Reflect.getOwnMetadata(
        CONTROLLER_PATH,
        controller.prototype
      );
      const boundInst = new bound();
      const proxy = this.makeProxy(boundInst);

      const routes = Reflect.getOwnMetadata(
        ROUTES,
        controller.prototype
      ) as Routes;

      this.mapGlobal(routes, controllerPath, proxy, boundInst);
      console.log({ globalMap: this.globalMap });
    }

    return this.createNestServer();
  }

  private static makeContextBound(controller: any, providers: any[]) {
    let bound = controller;
    const paramTypes = Reflect.getMetadata(PARAM_TYPES, controller);
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
    return bound;
  }

  private static makeProxy(instance: any) {
    return new Proxy(instance, {
      get(selfInst, method, receiver) {
        return function (this: any, { body, url }: MasterArg) {
          const self = Object.getPrototypeOf(selfInst);
          const parameters = Reflect.getOwnMetadata(method, self) ?? {};
          const newArgs: any[] = [];
          const params = (() => {
            const originalPath: string[] = (
              Reflect.getOwnMetadata(ORIGINAL_PATH, selfInst, method) ?? ''
            ).split('/');
            const incomingPath = url.slice(1).split('/') ?? [];
            const params = originalPath.reduce((params, frag, i) => {
              if (frag[0] === ':') params[frag.slice(1)] = incomingPath[i];
              return params;
            }, <Params>{});

            return params;
          })();
          console.log({ params });

          for (const idx in parameters) {
            if (parameters[idx] === BODY) {
              newArgs[+idx] = body;
              continue;
            }
            newArgs[+idx] = params[parameters[idx]];
          }
          console.log(newArgs);
          return Reflect.get(selfInst, method, receiver).apply(this, newArgs);
        };
      },
    });
  }

  private static mapGlobal(
    routes: Routes,
    controllerPath: string,
    proxy: any,
    boundInst: any
  ) {
    routes.forEach(({ path, method, httpMethod }) => {
      const handler = proxy[method];
      const ignoreFirstSlash = '^/+';
      const paramRegEx = '/\\w*';
      const regExpPath =
        ignoreFirstSlash +
        controllerPath +
        (path[1] === ':' ? paramRegEx : path === '/' ? '' : path);
      const originalPath = controllerPath + (path === '/' ? '' : path);

      /**
       * @boundInst에_metadata를_설정하는_이유
       * 이 부분을 제외하고는 다른 곳에서 metadata를 활용할 때는 prototype에 정의했다.
       * 이곳에서 instance에 설정하는 이유는 prototype에 OriginalPath가 정의되기 전에
       * proxy에 boundInst가 설정되었기 때문이다.
       * 결국 handler는 proxy객체에서 가져오는 것 인데, proxy에 boundInst가 설정된 이후에
       * 아래의 defineMetadata가 일어나므로 의미가 없다.
       *
       * 즉, 이미 instantiate된 객체에 metadata를 정의해야 참조가 가능하다.
       */
      Reflect.defineMetadata(ORIGINAL_PATH, originalPath, boundInst, method);

      this.globalMap
        .get(httpMethod)
        ?.set(new RegExp(regExpPath), handler.bind(boundInst));
    });
  }

  private static createNestServer() {
    return createServer((req, res) => {
      const url =
        req.url![req.url!.length - 1] === '/'
          ? req.url!.slice(0, req.url!.length - 1)
          : req.url!;
      if (req.method === POST) {
        let body = '';
        req
          .on('data', (chunk) => {
            body += chunk;
          })
          .on('end', () => {
            body = JSON.parse(body);
            const masterArg: MasterArg = { url, body };
            const methodHandlers = this.globalMap.get(req.method ?? GET) as Map<
              RegExp,
              Function
            >;
            for (const [regEx, handler] of methodHandlers) {
              if (regEx.test(url)) {
                res.write(JSON.stringify(handler(masterArg) ?? {}));
                res.end();
              }
            }
          });
      }
      if (req.method === GET) {
        const masterArg: MasterArg = { url, body: {} };
        const methodHandlers = this.globalMap.get(req.method ?? GET) as Map<
          RegExp,
          Function
        >;
        for (const [regEx, handler] of methodHandlers) {
          if (regEx.test(url)) {
            res.write(JSON.stringify(handler(masterArg) ?? {}));
            res.end();
            break;
          }
        }
      }
    });
  }
}
