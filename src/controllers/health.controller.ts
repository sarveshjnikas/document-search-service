import { Response } from 'express';
import { Get, JsonController, Res } from 'routing-controllers';
import { StatusCodes } from 'http-status-codes';
import { Inject, Service } from 'typedi';
import { BaseController } from '../base';
import { DocumentRepository } from '../repositories/document.repository';
import { ElasticsearchRepository } from '../repositories/elasticsearch.repository';
import { SEARCH_CACHE, SearchCache } from '../services/search-cache';

@JsonController()
@Service()
export class HealthController extends BaseController {
  @Inject(() => DocumentRepository)
  private readonly repository!: DocumentRepository;

  @Inject(() => ElasticsearchRepository)
  private readonly searchIndexRepository!: ElasticsearchRepository;

  @Inject(SEARCH_CACHE)
  private readonly cache!: SearchCache<unknown>;

  @Get('/health')
  async health(@Res() response: Response) {
    const [mysqlOk, elasticsearchOk, redisOk] = await Promise.all([
      this.repository.healthCheck().catch(() => false),
      this.searchIndexRepository.healthCheck().catch(() => false),
      this.cache.healthCheck().catch(() => false)
    ]);
    const isHealthy = mysqlOk && elasticsearchOk && redisOk;

    response.status(isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE).json({
      error: !isHealthy,
      statusCode: isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE,
      data: {
        service: 'up',
        mysql: mysqlOk ? 'up' : 'down',
        elasticsearch: elasticsearchOk ? 'up' : 'down',
        redis: redisOk ? 'up' : 'down'
      }
    });

    return;
  }
}
