import { DynamicModule, Module } from '@nestjs/common';
import { AsyncModelFactory, MongooseModule } from '@nestjs/mongoose';
import { RankingSchema } from '../interfaces/ranking.schema';


const features: AsyncModelFactory[] = [
  {
    name: 'Ranking',
    useFactory: () => RankingSchema
  }
];


export function configureMongooseFeatures(): DynamicModule {
  return MongooseModule.forFeatureAsync(features);
}

@Module({})
export class MongooseFeatures {  
  static register(): DynamicModule {
    return MongooseModule.forFeatureAsync(features)
  }
}