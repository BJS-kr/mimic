import { Server, createServer, ServerResponse } from 'node:http';
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
    const trap = {
      get(selfInst: any, method: string | symbol, receiver: any) {
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
    };

    return new Proxy(instance, trap);
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
       * @boundInst???_metadata???_????????????_??????
       * ??? ????????? ??????????????? ?????? ????????? metadata??? ????????? ?????? prototype??? ????????????.
       * ???????????? instance??? ???????????? ????????? prototype??? OriginalPath??? ???????????? ??????
       * proxy??? boundInst??? ??????????????? ????????????.
       * ?????? handler??? proxy???????????? ???????????? ??? ??????, proxy??? boundInst??? ????????? ?????????
       * ????????? defineMetadata??? ??????????????? ????????? ??????.
       *
       * ???, ?????? instantiate??? ????????? metadata??? ???????????? ????????? ????????????.
       */
      Reflect.defineMetadata(ORIGINAL_PATH, originalPath, boundInst, method);

      this.globalMap
        .get(httpMethod)
        ?.set(new RegExp(regExpPath), handler.bind(boundInst));
    });
  }

  private static createNestServer() {
    return createServer((req, res) => {
      const oUrl = req.url as string;
      const url =
        oUrl[oUrl.length - 1] === '/' ? oUrl.slice(0, oUrl.length - 1) : oUrl;
      const methodHandlers = this.globalMap.get(req.method ?? GET) as Map<
        RegExp,
        Function
      >;
      if (req.method === POST) {
        let body = '';
        req
          .on('data', (chunk) => {
            body += chunk;
          })
          .on('end', () => {
            body = JSON.parse(body);
            const masterArg: MasterArg = { url, body };
            this.execHandler(masterArg, methodHandlers, res);
          });
      }
      if (req.method === GET) {
        const masterArg: MasterArg = { url, body: {} };
        this.execHandler(masterArg, methodHandlers, res);
      }
    });
  }

  private static execHandler(
    masterArg: MasterArg,
    methodHandlers: Map<RegExp, Function>,
    res: ServerResponse
  ) {
    for (const [regEx, handler] of methodHandlers) {
      if (regEx.test(masterArg.url)) {
        res.write(JSON.stringify(handler(masterArg) ?? {}));
        res.end();
        break;
      }
    }
  }
}
