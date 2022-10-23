import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Module } from '../mimic/decorators';
@Module({
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
