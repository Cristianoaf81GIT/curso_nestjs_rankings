import { Module } from '@nestjs/common';
import { ClientProxySmartRanking } from './proxyrmq.service';

@Module({
  providers: [ClientProxySmartRanking],
  exports: [ClientProxySmartRanking]
})
export class ProxyrmqModule {}
