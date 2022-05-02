import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main');
  const config = new ConfigService();
  const APP_PORT = Number(config.get<string>('APP_PORT'));
  const MICRO_TRANSPORT = Number(config.get<string>('TRANSPORT'));
  const MICRO_URLS = `${config.get<string>('SERVER_URL_LOCAL')}`;
  const MICRO_NOACK = config.get<string>('NOACK') === 'true';
  const MICRO_QUEUE = config.get<string>('RANKINGS_QUEUE_NAME');

  // const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
  //   transport: MICRO_TRANSPORT,
  //   options: {
  //     urls: [MICRO_URLS],
  //     noAck: MICRO_NOACK,
  //     queue: MICRO_QUEUE,
  //   }
  // })

  const app = await NestFactory.create(AppModule);
  app.connectMicroservice({
    transport: MICRO_TRANSPORT,
    options: {
      urls: [MICRO_URLS],
      noAck: MICRO_NOACK,
      queue: MICRO_QUEUE,
    }
  });
  logger.log('Microservice is listening');
  await app.startAllMicroservices();
  await app.listen(APP_PORT);
  // await app.listen();
}
bootstrap();
