import { Module } from '@nestjs/common';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { MongooseFeatures } from './config/mongoose.features.config';
import { ProxyrmqModule } from '../proxyrmq/proxyrmq.module';
import { MongooseModule } from '@nestjs/mongoose';
import { RankingSchema } from './interfaces/ranking.schema';


@Module({
  imports: [
    MongooseFeatures.register(),
    //   MongooseModule.forFeatureAsync([
    //   { 
    //     name: 'Ranking',
    //     useFactory: () => RankingSchema
    //   }
    // ]),
    ProxyrmqModule
  ],
  providers: [RankingsService],
  controllers: [RankingsController]
})
export class RankingsModule {}
