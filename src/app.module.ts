import { Module } from '@nestjs/common';
import { RankingsModule } from './rankings/rankings.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseConfigClass } from './config/database/mongoose.config.class';
import { ProxyrmqModule } from './proxyrmq/proxyrmq.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      useClass: MongooseConfigClass
    }),
    RankingsModule,
    ProxyrmqModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
