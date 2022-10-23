import 'reflect-metadata';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ModuleMetadata } from './types';

function Module(moduleMetadata: ModuleMetadata) {
	return function (self: Function) {
		for (const prop in moduleMetadata) {
			if (moduleMetadata.hasOwnProperty(prop)) {
				Reflect.defineMetadata(
					prop,
					moduleMetadata[prop as keyof ModuleMetadata],
					self
				);
			}
		}
	};
}

@Module({
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
