import { AppService } from './app.service';
import { BODY } from './symbols';

function Controller(name?: string) {
	return function (self: Function) {
		Reflect.defineMetadata('controllerPath', name, self.prototype);
	};
}
function Get(path: string) {
	return function (self: any, method: string, descriptor: PropertyDescriptor) {
		const routes = Reflect.getOwnMetadata('Routes', self) ?? [];
		Reflect.defineMetadata(
			'Routes',
			[{ path, method, httpMethod: 'GET' }, ...routes],
			self
		);
	};
}
function Post(path: string) {
	return function (self: any, method: string, descriptor: PropertyDescriptor) {
		const routes = Reflect.getOwnMetadata('Routes', self) ?? [];
		Reflect.defineMetadata(
			'Routes',
			[{ path, method, httpMethod: 'POST' }, ...routes],
			self
		);
	};
}
function Param(name: string | symbol) {
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
function Body() {
	return Param(BODY);
}

@Controller('home')
export class AppController {
	constructor(private readonly appService: AppService) {}
	@Get('/')
	findAll() {
		return this.appService.findAll();
	}
	@Get('/:id')
	findOne(@Param('id') id: string) {
		return this.appService.findOne(id);
	}
	@Post('/:id')
	insertOne(@Param('id') id: string, @Body() body: any) {
		return this.appService.insertOne(id, body.val);
	}
}
