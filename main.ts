import { AppModule } from './app.module';
import { NestFactory } from './nest.factory'

async function bootstrap() {
  process.on('uncaughtException', (err) => {
    
  })
  const app = await NestFactory.create(AppModule);
  await app.listen(8888);
}
bootstrap();