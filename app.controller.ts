import { AppService } from './app.service'
import { AnyClass } from './types';


function Controller(name?:string) {
  return function(self: Function) {
    Reflect.defineMetadata('controllerPath', name, self.prototype);
  }
}
function Get(path:string) {
  return function(self: any, method: string, descriptor: PropertyDescriptor){
    Reflect.defineMetadata(path, { method, httpMethod: 'GET'}, self);
  }
}
function Post(path:string) {
  return function(self: any, method: string, descriptor: PropertyDescriptor){}
}
function Param(name:string) {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number){}
}
function Body() {
  return function(target: Object, propertyKey: string | symbol, parameterIndex: number){}
}

@Controller('home')
export class AppController {
  constructor(private readonly appService:AppService) {}
  @Get('/')
  findAll() {
    return this.appService.findAll();
  }
  @Get('/:id')
  findOne(@Param('id') id:string) {
    return this.appService.findOne(id);
  }
  @Post('/:id')
  insertOne(@Param('id') id:string, @Body() body:any) {
    return this.appService.insertOne(id, body.val);
  }
}