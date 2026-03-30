import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import { useExpressServer, useContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { StatusCodes } from 'http-status-codes';
import { JobPostingController } from './controllers/document.controller';
import { HealthController } from './controllers/health.controller';
import { DocumentRepository } from './repositories/document.repository';
import { ElasticsearchRepository } from './repositories/elasticsearch.repository';
import { RedisCacheService } from './services/redis-cache.service';
import { DocumentService } from './services/document.service';
import { RateLimitService } from './services/rate-limit.service';
import { createRateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { errorMiddleware } from './middlewares/error.middleware';
import { JobPostingSearchResultInterface } from './interfaces';
import { SEARCH_CACHE, SearchCache } from './services/search-cache';

export interface AppDependencies {
  repository?: DocumentRepository;
  searchIndexRepository?: ElasticsearchRepository;
  cache?: SearchCache<JobPostingSearchResultInterface[]>;
  documentService?: DocumentService;
  rateLimitService?: RateLimitService;
}

export function createApp(dependencies: AppDependencies = {}) {
  const repository = dependencies.repository ?? new DocumentRepository();
  const searchIndexRepository = dependencies.searchIndexRepository ?? new ElasticsearchRepository();
  const cache = dependencies.cache ?? new RedisCacheService<JobPostingSearchResultInterface[]>();
  const documentService = dependencies.documentService ?? new DocumentService(repository, searchIndexRepository, cache);
  const rateLimitService = dependencies.rateLimitService ?? new RateLimitService();

  Container.reset();
  Container.set(DocumentRepository, repository);
  Container.set(ElasticsearchRepository, searchIndexRepository);
  Container.set(SEARCH_CACHE, cache);
  Container.set(DocumentService, documentService);
  Container.set(RateLimitService, rateLimitService);
  useContainer(Container);

  const app = express();
  app.use(helmet());
  app.use(createRateLimitMiddleware(rateLimitService));

  useExpressServer(app, {
    controllers: [JobPostingController, HealthController],
    validation: {
      validationError: {
        target: false,
        value: false
      }
    },
    classTransformer: true,
    defaultErrorHandler: false,
    defaults: {
      undefinedResultCode: StatusCodes.NO_CONTENT,
      nullResultCode: StatusCodes.NOT_FOUND
    }
  });

  app.use(errorMiddleware);

  return app;
}
