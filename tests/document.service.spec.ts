import { CacheService } from '../src/services/cache.service';
import { DocumentService } from '../src/services/document.service';
import {
  CreateJobPostingInterface,
  JobPostingInterface,
  JobPostingSearchResultInterface
} from '../src/interfaces';

class FakeRepository {
  documents = new Map<string, JobPostingInterface>();

  async createJobPosting(id: string, tenantId: string, input: CreateJobPostingInterface): Promise<JobPostingInterface> {
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

  async getJobPostingById(id: string, tenantId: string): Promise<JobPostingInterface | null> {
    return this.documents.get(`${tenantId}:${id}`) ?? null;
  }

  async deleteJobPostingById(id: string, tenantId: string): Promise<boolean> {
    return this.documents.delete(`${tenantId}:${id}`);
  }

  async searchJobPostings(tenantId: string, query: string): Promise<JobPostingSearchResultInterface[]> {
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

class FakeSearchIndexRepository {
  documents = new Map<string, JobPostingInterface>();

  async indexJobPosting(document: JobPostingInterface): Promise<void> {
    this.documents.set(document.id, document);
  }

  async deleteJobPosting(id: string): Promise<void> {
    this.documents.delete(id);
  }

  async searchJobPostings(tenantId: string, query: string): Promise<JobPostingSearchResultInterface[]> {
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

describe('DocumentService', () => {
  it('isolates documents by tenant', async () => {
    const repository = new FakeRepository();
    const searchIndexRepository = new FakeSearchIndexRepository();
    const cache = new CacheService<JobPostingSearchResultInterface[]>();
    const service = new DocumentService(repository as never, searchIndexRepository as never, cache);

    const doc = await service.create('tenant-a', {
      name: 'Senior TypeScript Engineer',
      employmentType: 'full_time',
      isRemote: true,
      details: 'Build a distributed search service',
      minSalary: 120000,
      maxSalary: 180000,
      location: 'Bengaluru',
      companyName: 'Acme'
    });

    await service.create('tenant-b', {
      name: 'Senior TypeScript Engineer',
      employmentType: 'full_time',
      isRemote: true,
      details: 'Build a distributed search service',
      minSalary: 120000,
      maxSalary: 180000,
      location: 'Bengaluru',
      companyName: 'Acme'
    });

    expect(await service.getById('tenant-a', doc.id)).not.toBeNull();
    expect(await service.getById('tenant-b', doc.id)).toBeNull();
  });

  it('caches search results per tenant and query', async () => {
    const repository = new FakeRepository();
    const searchIndexRepository = new FakeSearchIndexRepository();
    const cache = new CacheService<JobPostingSearchResultInterface[]>();
    const service = new DocumentService(repository as never, searchIndexRepository as never, cache);

    await service.create('tenant-a', {
      name: 'Search Service Engineer',
      employmentType: 'contractual',
      isRemote: true,
      details: 'Fast document search platform',
      minSalary: 90000,
      maxSalary: 110000,
      location: 'Remote',
      companyName: 'Acme'
    });

    const first = await service.search('tenant-a', 'search');
    const second = await service.search('tenant-a', 'search');

    expect(first).toEqual(second);
    expect(first).toHaveLength(1);
  });
});
