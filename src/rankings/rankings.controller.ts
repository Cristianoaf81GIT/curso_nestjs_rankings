import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, RpcException } from '@nestjs/microservices';
import { Partida } from './interfaces/partida.interface';
import { RankingsService } from './rankings.service';


// cod msg duplicada
const ackErros:string[] = ['E1000'];

@Controller()
export class RankingsController {
  private readonly logger = new Logger(RankingsController.name);

  constructor(private readonly rankingService: RankingsService) {}

  @EventPattern('processar-partida')
  async processarPartida(
    @Payload() data: any,
    @Ctx() context: RmqContext
  ) {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();
    console.log('executando')
    try {
      this.logger.log(`[processarPartida]::data: ${JSON.stringify(data)}`);
      const idPartida: string = data.idPartida;
      const partida: Partida = data.partida;
      await this.rankingService.processarPartida(idPartida, partida);
      await channel.ack(originalMessage);
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      const filterAckError = ackErros.filter(
        ackError => error.message.includes(ackError)
      );

      if (filterAckError.length > 0) {
        await channel.ack(originalMessage);
      }

      throw new RpcException(error.message);
    }
  }
}
