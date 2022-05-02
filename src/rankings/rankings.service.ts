import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { Partida } from './intefaces/partida.interface';
import { Ranking } from './intefaces/ranking.schema';
import { Model } from 'mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ClientProxySmartRanking } from '../proxyrmq/proxyrmq.service';
import { Categoria } from './intefaces/categoria.interface';
import { EventoNome } from './evento-nome.enum';

@Injectable()
export class RankingsService {

  private readonly logger = new Logger(RankingsService.name);
  private clientAdminBackend: ClientProxy;
  
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
    private clientProxySmartRanking: ClientProxySmartRanking  
    ) {
      this.clientAdminBackend = this.clientProxySmartRanking.getClientProxyBackendInstance();
    }
   
  async processarPartida(idPartida: string, partida: Partida): Promise<void> {
    try {
      const categoria: Categoria = await lastValueFrom(
        this.clientAdminBackend.send('consultar-categorias', partida.categoria)
      );
      this.logger.log(`categoria encontrada: ${JSON.stringify(categoria)}`);
      await Promise.all(partida.jogadores.map(async (jogador) => {
        const ranking = new this.desafioModel();
        ranking.categoria = partida.categoria;
        ranking.desafio = partida.desafio;
        ranking.partida = idPartida;
        ranking.jogador = jogador;
  
        if (jogador == partida.def) {
          const eventoFilter = categoria.eventos.find(evento => evento.nome == EventoNome.VITORIA);
          ranking.evento = EventoNome.VITORIA;
          ranking.operacao = eventoFilter.operacao;
          ranking.pontos = eventoFilter.valor;
          ranking.operacao = eventoFilter.operacao;       
        } else {
          const eventoFilter = categoria.eventos.find(evento => evento.nome == EventoNome.DERROTA);
          ranking.evento = EventoNome.DERROTA;
          ranking.operacao = eventoFilter.operacao;
          ranking.pontos = eventoFilter.valor;
          ranking.operacao = eventoFilter.operacao;        
        }
        this.logger.log(`ranking: ${JSON.stringify(ranking)}`);
        await ranking.save();
      })); 
      
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

}
