import { Client } from '@elastic/elasticsearch';
import { Service } from 'typedi';
import { BaseRepository } from '../base';
import { resolveElasticsearchConfig } from '../config/elasticsearch.config';
import {
  JobPostingInterface,
  JobPostingSearchResultInterface
} from '../interfaces';
import { toIsoDateTime } from '../types/date';

type ElasticsearchJobPostingDocument = JobPostingInterface;

type ElasticsearchHit = {
  _id: string;
  _score?: number | null;
  _source?: ElasticsearchJobPostingDocument;
  highlight?: {
    details?: string[];
  };
};

@Service()
export class ElasticsearchRepository extends BaseRepository {
  private readonly client = new Client({
    node: resolveElasticsearchConfig().url
  });

  private readonly indexName = resolveElasticsearchConfig().indexName;
  private ensureIndexPromise: Promise<void> | null = null;

  private async ensureIndex(): Promise<void> {
    if (!this.ensureIndexPromise) {
      this.ensureIndexPromise = this.createIndexIfMissing().catch((error) => {
        this.ensureIndexPromise = null;
        throw error;
      });
    }

    await this.ensureIndexPromise;
  }

  private async createIndexIfMissing(): Promise<void> {
    const exists = await this.client.indices.exists({
      index: this.indexName
    });

    if (exists) {
      return;
    }

    await this.client.indices.create({
      index: this.indexName,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          tenantId: { type: 'keyword' },
          name: { type: 'text' },
          employmentType: { type: 'keyword' },
          isRemote: { type: 'boolean' },
          details: { type: 'text' },
          minSalary: { type: 'double' },
          maxSalary: { type: 'double' },
          location: { type: 'text' },
          companyName: { type: 'text' },
          createdAt: { type: 'keyword' },
          updatedAt: { type: 'keyword' }
        }
      }
    });
  }

  private mapSearchHit(hit: ElasticsearchHit): JobPostingSearchResultInterface | null {
    if (!hit._source) {
      return null;
    }

    const highlightSnippet = hit.highlight?.details?.[0];

    return {
      id: hit._source.id,
      tenantId: hit._source.tenantId,
      name: hit._source.name,
      employmentType: hit._source.employmentType,
      isRemote: hit._source.isRemote,
      details: hit._source.details,
      location: hit._source.location,
      companyName: hit._source.companyName,
      createdAt: toIsoDateTime(hit._source.createdAt),
      updatedAt: toIsoDateTime(hit._source.updatedAt),
      snippet: highlightSnippet ?? hit._source.details.slice(0, 180),
      score: Number(hit._score ?? 0)
    };
  }

  async indexJobPosting(jobPosting: JobPostingInterface): Promise<void> {
    await this.ensureIndex();
    const document: JobPostingInterface = {
      ...jobPosting,
      createdAt: toIsoDateTime(jobPosting.createdAt),
      updatedAt: toIsoDateTime(jobPosting.updatedAt)
    };
    await this.client.index({
      index: this.indexName,
      id: jobPosting.id,
      document,
      refresh: 'wait_for'
    });
  }

  async deleteJobPosting(id: string): Promise<void> {
    await this.ensureIndex();

    try {
      await this.client.delete({
        index: this.indexName,
        id,
        refresh: 'wait_for'
      });
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return;
      }

      throw error;
    }
  }

  async searchJobPostings(
    tenantId: string,
    query: string,
    limit = 20
  ): Promise<JobPostingSearchResultInterface[]> {
    await this.ensureIndex();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const response = await this.client.search<ElasticsearchJobPostingDocument>({
      index: this.indexName,
      size: limit,
      track_total_hits: true,
      query: {
        bool: {
          filter: [{ term: { tenantId } }],
          must: [
            {
              multi_match: {
                query: trimmedQuery,
                fields: ['name^4', 'details^3', 'location^2', 'companyName^2', 'employmentType'],
                fuzziness: 'AUTO',
                operator: 'and'
              }
            }
          ]
        }
      },
      highlight: {
        fields: {
          details: {
            fragment_size: 160,
            number_of_fragments: 1
          }
        }
      },
      sort: [{ _score: { order: 'desc' } }, { updatedAt: { order: 'desc' } }]
    });

    return response.hits.hits
      .map((hit) => this.mapSearchHit(hit as ElasticsearchHit))
      .filter((item): item is JobPostingSearchResultInterface => item !== null);
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }

  private isNotFoundError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const statusCode = (error as { meta?: { statusCode?: number } }).meta?.statusCode;
    return statusCode === 404;
  }
}
