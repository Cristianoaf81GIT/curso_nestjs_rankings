import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';

@Injectable()
export class MongooseConfigClass implements MongooseOptionsFactory {
  constructor(private config: ConfigService) {}
  createMongooseOptions(): MongooseModuleOptions | Promise<MongooseModuleOptions> {
    return {
      uri: this.config.get<string>('MONGO_URI'),
      useNewUrlParser:
        this.config.get<string>('useNewUrlParser') === 'true',
      autoIndex: this.config.get<string>('autoIndex') === 'true',
      autoCreate: this.config.get<string>('autoCreate') === 'true',
      useUnifiedTopology:
        this.config.get<string>('useUnifiedTopology') === 'true',
    }
  }  
}