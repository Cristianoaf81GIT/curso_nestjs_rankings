import { ClientProxy, ClientProxyFactory } from '@nestjs/microservices';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class ClientProxySmartRanking {
  constructor(private configService: ConfigService) {}

  getClientProxyBackendInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: +this.configService.get<string>('TRANSPORT_LOCAL'),
      options: {
        urls: [`${this.configService.get<string>('SERVER_URL_LOCAL')}`],
        queue: this.configService.get<string>('QUEUE_NAME')
      }
    });
  }

  getClientDesafiosInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: +this.configService.get<string>('TRANSPORT_LOCAL'),// Transport.RMQ,
      options: {
        urls: [`${this.configService.get<string>('SERVER_URL_LOCAL')}`],
        queue: this.configService.get<string>('CHALLENGES_QUEUE_NAME'),             
      },
    });
  }

  getClientProxyRankingsInstance(): ClientProxy {
    return ClientProxyFactory.create({
      transport: +this.configService.get<string>('TRANSPORT_LOCAL'),// Transport.RMQ,
      options: {
        urls: [`${this.configService.get<string>('SERVER_URL_LOCAL')}`],
        queue: this.configService.get<string>('RANKINGS_QUEUE_NAME'),       
      },
    });
  }
}