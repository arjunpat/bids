import { Db, MongoClient } from 'mongodb';
import { MONGO_URI } from './config';

class Mongo {
  public client: MongoClient;
  public db: Db;

  public constructor(uri, db) {
    this.client = new MongoClient(uri);
    this.db = this.client.db(db);
    this.client.connect();
  }
}

export default new Mongo(MONGO_URI, 'bids');