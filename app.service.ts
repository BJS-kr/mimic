import 'reflect-metadata';
import { INJECTABLE_SIGNATURE } from './symbols';

function Injectable() {
	return function (constructor: Function) {
		Reflect.defineMetadata(INJECTABLE_SIGNATURE, true, constructor);
	};
}

@Injectable()
export class AppService {
	private DB: { [K in string]: string } = {};

	findAll() {
		return this.DB;
	}
	findOne(id: string) {
		return this.DB[id];
	}
	insertOne(id: string, val: string) {
		this.DB[id] = val;
	}
}
