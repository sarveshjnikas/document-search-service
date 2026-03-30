import request from 'supertest';
import { createApp } from '../src/app';
import { DocumentRepository } from '../src/repositories/document.repository';
import { JobPostingInterface } from '../src/interfaces';
import { CacheService } from '../src/services/cache.service';
import { JobPostingSearchResultInterface } from '../src/interfaces';

class StubRepository extends DocumentRepository {
  private documents = new Map<string, JobPostingInterface>();

  override async healthCheck(): Promise<boolean> {
    return true;
  }

  override async createJobPosting(id: string, tenantId: string, input: {
    name: string;
    employmentType: 'full_time' | 'part_time' | 'contractual';
    isRemote: boolean;
    details: string;
    minSalary: number;
    maxSalary: number;
    location: string;
    companyName?: string | null;
  }): Promise<JobPostingInterface> {
    const document: JobPostingInterface = {
      id,
      tenantId,
      name: input.name,
      employmentType: input.employmentType,
      isRemote: input.isRemote,
      details: input.details,
      minSalary: input.minSalary,
      maxSalary: input.maxSalary,
      location: input.location,
      companyName: input.companyName ?? null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    this.documents.set(`${tenantId}:${id}`, document);
    return document;
  }

  override async getJobPostingById(id: string, tenantId: string): Promise<JobPostingInterface | null> {
    return this.documents.get(`${tenantId}:${id}`) ?? null;
  }

  override async deleteJobPostingById(id: string, tenantId: string): Promise<boolean> {
    return this.documents.delete(`${tenantId}:${id}`);
  }
}

class StubSearchIndexRepository {
  private documents = new Map<string, JobPostingInterface>();

  async healthCheck(): Promise<boolean> {
    return true;
  }

  async indexJobPosting(document: JobPostingInterface): Promise<void> {
    this.documents.set(document.id, document);
  }

  async deleteJobPosting(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async searchJobPostings(tenantId: string, query: string) {
    return [...this.documents.values()]
      .filter((document) => document.tenantId === tenantId && `${document.name} ${document.details}`.toLowerCase().includes(query.toLowerCase()))
      .map((document) => ({
        id: document.id,
        tenantId: document.tenantId,
        name: document.name,
        employmentType: document.employmentType,
        isRemote: document.isRemote,
        details: document.details,
        location: document.location,
        companyName: document.companyName,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        snippet: document.details.slice(0, 180),
        score: 1
      }));
  }
}

describe('HTTP API', () => {
  it('creates, searches, fetches, and deletes a document', async () => {
    const repository = new StubRepository();
    const searchIndexRepository = new StubSearchIndexRepository();
    const cache = new CacheService<JobPostingSearchResultInterface[]>();
    const app = createApp({
      repository,
      searchIndexRepository: searchIndexRepository as never,
      cache
    });

    const createResponse = await request(app)
      .post('/documents')
      .set('x-tenant-id', 'tenant-a')
      .send({
        name: 'Senior Node Engineer',
        employmentType: 'full_time',
        isRemote: true,
        details: 'The quick brown fox',
        minSalary: 120000,
        maxSalary: 180000,
        location: 'Remote',
        companyName: 'Acme'
      });

    expect(createResponse.status).toBe(201);
    const id = createResponse.body.data.id;

    const searchResponse = await request(app)
      .get('/search')
      .query({ q: 'quick' })
      .set('x-tenant-id', 'tenant-a');
    expect(searchResponse.status).toBe(200);
    expect(searchResponse.body.data.items).toHaveLength(1);

    const fetchResponse = await request(app)
      .get(`/documents/${id}`)
      .set('x-tenant-id', 'tenant-a');
    expect(fetchResponse.status).toBe(200);
    expect(fetchResponse.body.data.id).toBe(id);

    const deleteResponse = await request(app)
      .delete(`/documents/${id}`)
      .set('x-tenant-id', 'tenant-a');
    expect(deleteResponse.status).toBe(204);
  });

  it('rejects missing tenant ids', async () => {
    const app = createApp({
      repository: new StubRepository(),
      searchIndexRepository: new StubSearchIndexRepository() as never,
      cache: new CacheService<JobPostingSearchResultInterface[]>()
    });

    const response = await request(app).get('/health');
    expect(response.status).toBe(200);

    const searchResponse = await request(app).get('/search').query({ q: 'test' });
    expect(searchResponse.status).toBe(400);
  });
});
