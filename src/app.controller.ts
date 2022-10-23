import { AppService } from './app.service';
import { Body, Controller, Get, Param, Post } from '../mimic/decorators';
@Controller('home')
export class AppController {
  constructor(private appService: AppService) {}
  @Get('/')
  findAll() {
    return this.appService.findAll();
  }
  @Get('/:id')
  findOne(@Param('id') id: string) {
    return this.appService.findOne(id);
  }
  @Post('/:id')
  insertOne(@Param('id') id: string, @Body() { val }: { val: string }) {
    return this.appService.insertOne(id, val);
  }
}
