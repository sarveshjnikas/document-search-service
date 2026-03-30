import { randomUUID } from 'crypto';
import { appConfig } from '../config/app.config';
import {
  CreateJobPostingInterface,
  JobPostingInterface,
  JobPostingSearchResultInterface
} from '../interfaces';
import { BaseService } from '../base';
import { SearchCache } from './search-cache';
import { SEARCH_CACHE } from './search-cache';
import { DocumentRepository } from '../repositories/document.repository';
import { ElasticsearchRepository } from '../repositories/elasticsearch.repository';
import { Inject, Service } from 'typedi';

@Service()
export class DocumentService extends BaseService {
  constructor(
    @Inject(() => DocumentRepository)
    private readonly repository: DocumentRepository,
    @Inject(() => ElasticsearchRepository)
    private readonly searchIndexRepository: ElasticsearchRepository,
    @Inject(SEARCH_CACHE)
    private readonly cache: SearchCache<JobPostingSearchResultInterface[]>
  ) {
    super();
  }

  async create(tenantId: string, input: CreateJobPostingInterface): Promise<JobPostingInterface> {
    const id = randomUUID();
    const created = await this.repository.createJobPosting(id, tenantId, input);

    try {
      await this.searchIndexRepository.indexJobPosting(created);
      await this.cache.invalidateTenant(tenantId);
      return created;
    } catch (error) {
      await this.repository.deleteJobPostingById(id, tenantId).catch(() => undefined);
      throw error;
    }
  }

  async getById(tenantId: string, id: string): Promise<JobPostingInterface | null> {
    return this.repository.getJobPostingById(id, tenantId);
  }

  async deleteById(tenantId: string, id: string): Promise<boolean> {
    const deleted = await this.repository.deleteJobPostingById(id, tenantId);
    if (deleted) {
      await this.cache.invalidateTenant(tenantId);
      await this.searchIndexRepository.deleteJobPosting(id).catch(() => undefined);
    }
    return deleted;
  }

  async search(tenantId: string, query: string): Promise<JobPostingSearchResultInterface[]> {
    const cached = await this.cache.get(tenantId, query);
    if (cached) {
      return cached;
    }

    const results = await this.searchIndexRepository.searchJobPostings(tenantId, query);
    await this.cache.set(tenantId, query, results, appConfig.searchCacheTtlMs);
    return results;
  }
}
