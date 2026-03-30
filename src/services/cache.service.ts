import { Service } from 'typedi';
import { SearchCache } from './search-cache';

@Service()
export class CacheService<T> implements SearchCache<T> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();
  private readonly tenantVersions = new Map<string, number>();

  private buildVersionedKey(tenantId: string, query: string): string {
    const normalizedTenant = tenantId.trim().toLowerCase();
    const normalizedQuery = query.trim().toLowerCase();
    const version = this.tenantVersions.get(normalizedTenant) ?? 1;
    return `${normalizedTenant}:search:v${version}:${normalizedQuery}`;
  }

  async get(tenantId: string, query: string): Promise<T | null> {
    const key = this.buildVersionedKey(tenantId, query);
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(tenantId: string, query: string, value: T, ttlMs: number): Promise<void> {
    const key = this.buildVersionedKey(tenantId, query);
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    const normalizedTenant = tenantId.trim().toLowerCase();
    const currentVersion = this.tenantVersions.get(normalizedTenant) ?? 1;
    this.tenantVersions.set(normalizedTenant, currentVersion + 1);
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
