import { AppModule } from './src/app.module';
import { MimicFactory } from './mimic/factory';

async function bootstrap() {
	const app = MimicFactory.create(AppModule);
	await app.listen(8888);
}
bootstrap();
