import { Injectable } from '../mimic/decorators';
import { DB } from '../mimic/types';

@Injectable()
export class AppService {
  private db: DB = {};

  findAll() {
    return this.db;
  }
  findOne(id: string) {
    return this.db[id];
  }
  insertOne(id: string, val: string) {
    this.db[id] = val;
  }
}
