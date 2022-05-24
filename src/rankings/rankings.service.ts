import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/mongoose';
import { format } from 'date-fns-tz';
import ptBR from 'date-fns/locale/pt-BR';
import { Partida } from './interfaces/partida.interface';
import { Ranking } from './interfaces/ranking.schema';
import { Model } from 'mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ClientProxySmartRanking } from '../proxyrmq/proxyrmq.service';
import { Categoria } from './interfaces/categoria.interface';
import { EventoNome } from './evento-nome.enum';
import { RankingResponse, Historico } from './interfaces/ranking-response.interface';
import { Desafio } from './interfaces/desafio.interface';
import * as _ from 'lodash';
@Injectable()
export class RankingsService {

  private readonly logger = new Logger(RankingsService.name);
  
  private clientAdminBackend: ClientProxy;

  private clientDesafios: ClientProxy;
  
  constructor(
    @InjectModel('Ranking') private readonly desafioModel: Model<Ranking>,
    private clientProxySmartRanking: ClientProxySmartRanking  
    ) {
      this.clientAdminBackend = this.clientProxySmartRanking.getClientProxyBackendInstance();
      this.clientDesafios = this.clientProxySmartRanking.getClientDesafiosInstance();
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

  async consultarRankings(idCategoria: any, dataRef: string): Promise<RankingResponse[] | RankingResponse> {
    try {
      this.logger.log(`idCategoria: ${idCategoria}, dataRef: ${dataRef}`);
      if (!dataRef) {
        dataRef = format(Date.now(),'yyyy-MM-dd', {
          timeZone: 'America/Sao_Paulo',
          locale: ptBR
        });
        this.logger.log(`dataRef: ${dataRef}`);
      }
      /**
       * Recupera os registros de partidas processadas com
       * base na categoria, filtrando a categoria recebida
       * na requisição.
       */
      const registrosRanking = await this.desafioModel
        .find()
        .where('categoria')
        .equals(idCategoria)
        .exec();
 
       /**
       * agora recuperamos os desafios com data menor ou igual
       * a data que recebemos a requisição. Somente recupera
       * desafios com status igual a 'REALIZADO' e filtrando 
       * a categoria
       */
      const desafios: Desafio[] = await lastValueFrom(
          this.clientDesafios.send('consultar-desafios-realizados', {
        idCategoria, 
        dataRef
        }
      ));

      /**
       * realizaremos um loop nos registros q recuperamos no ranking (partidas processadas)
       * e descartaremos os registros (com base no id do desafio) que não retornaram no 
       * objeto desafios
       */
      _.remove(registrosRanking, function(item: any) {
        return desafios.filter(desafio => desafio._id == item.desafio).length === 0;
      });

      this.logger.log(`registrosRanking: ${JSON.stringify(registrosRanking)}`);

      // Agrupar por jogador
      const result = _(registrosRanking)
        .groupBy('jogador')
        .map((items, key) => ({
          'jogador': key,
          'historico': _.countBy(items, 'evento'),
          'pontos': _.sumBy(items, 'pontos')
        }))
        .value();      

      const resultadoOrdenado = _.orderBy(result, 'pontos', 'desc');
      this.logger.log(`resultado: ${JSON.stringify(resultadoOrdenado)}`);
      const rankingResponseList: RankingResponse[] = resultadoOrdenado.map((item, index) => {
        return {
          jogador: item.jogador,
          posicao: index + 1,
          pontuacao: item.pontos,
          historicoPartidas: {
            vitorias: item.historico.VITORIA ? item.historico.VITORIA : 0,
            derrotas: item.historico.DERROTA ? item.historico.DERROTA : 0
          }
        } as RankingResponse;
      });  
      return rankingResponseList;
    } catch (error) {
      this.logger.error(`error: ${JSON.stringify(error.message)}`);
      throw new RpcException(error.message);
    }
  }

}
