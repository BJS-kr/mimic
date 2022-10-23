import {
	Server,
	createServer,
	IncomingMessage,
	ServerResponse,
} from 'node:http';
import { BODY, INJECTABLE_SIGNATURE } from './symbols';
import { AnyClass, Routes } from './types';

const globalMap = new Map([
	['GET', new Map()],
	['POST', new Map()],
	['PUT', new Map()],
	['PATCH', new Map()],
	['DELETE', new Map()],
]);

export class NestFactory {
	static create(module: AnyClass): Server {
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

			const controllerPath = Reflect.getOwnMetadata(
				'controllerPath',
				controller.prototype
			);
			const proxy = new Proxy(new bound(), {
				get(selfInst, method, receiver) {
					return function (this: any, req: IncomingMessage) {
						const self = Object.getPrototypeOf(selfInst);
						const parameters = Reflect.getOwnMetadata(method, self) ?? {};
						const newArgs: any[] = [];
						let body = '';
						req
							.on('data', (chunk) => {
								body += chunk;
							})
							.on('end', () => {
								body = JSON.parse(body);
								console.log({ body });

								const params = (() => {
									const originalPath: string[] = (
										Reflect.getOwnMetadata('OriginalPath', self, method) ?? ''
									).split('/');
									const incomingPath = req.url?.slice(1).split('/') ?? [];
									const params = originalPath.reduce((params, frag, i) => {
										if (frag[0] === ':')
											params[frag.slice(1)] = incomingPath[i];
										return params;
									}, <{ [K in string]: any }>{});

									return params;
								})();
								console.log(params);

								for (const idx in parameters) {
									if (parameters[idx] === BODY) {
										newArgs[+idx] = body;
										continue;
									}
									newArgs[+idx] = params.get(parameters[idx]);
								}

								console.log({ newArgs });
								return Reflect.get(selfInst, method, receiver).apply(
									this,
									newArgs
								);
							});
					};
				},
			});

			const routes = Reflect.getOwnMetadata(
				'Routes',
				controller.prototype
			) as Routes;

			routes.forEach(({ path, method, httpMethod }) => {
				const handler = proxy[method];
				// 정규표현식으로 바꿔야함
				const ignoreFirstSlash = '^/+';
				const paramRegEx = '/\\w*';
				const originalPath = controllerPath + path;
				const regExpPath =
					ignoreFirstSlash +
					controllerPath +
					(path[1] === ':' ? paramRegEx : path);
				Reflect.defineMetadata('OriginalPath', originalPath, bound, method);
				globalMap.get(httpMethod)?.set(new RegExp(regExpPath), handler);
			});

			console.log({ globalMap });
		}

		const server = createServer((req, res) => {
			void (function (req: IncomingMessage, res: ServerResponse) {
				const methodHandlers = globalMap.get(req.method ?? 'GET') as Map<
					RegExp,
					Function
				>;
				for (const [regEx, handler] of methodHandlers) {
					if (regEx.test(req.url ?? '')) {
						res.write(handler(req));
						res.end();
						return;
					}
				}
				// 404 반환처리
			})(req, res);
		});

		return server;
	}
}
