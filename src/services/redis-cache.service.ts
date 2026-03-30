import { createClient, RedisClientType } from 'redis';
import { Service } from 'typedi';
import { resolveRedisConfig } from '../config/redis.config';
import { SearchCache } from './search-cache';

@Service()
export class RedisCacheService<T> implements SearchCache<T> {
  private readonly client: RedisClientType;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.client = createClient({
      url: resolveRedisConfig().url
    });

    this.client.on('error', () => undefined);
  }

  private async ensureConnected(): Promise<void> {
    if (this.client.isOpen) {
      return;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.client.connect().then(() => undefined).catch((error) => {
        this.connectionPromise = null;
        throw error;
      });
    }

    await this.connectionPromise;
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  private versionKey(tenantId: string): string {
    return `tenant:${this.normalize(tenantId)}:cacheVersion`;
  }

  private searchKey(tenantId: string, query: string, version: number): string {
    return `${this.normalize(tenantId)}:search:v${version}:${this.normalize(query)}`;
  }

  private async tenantVersion(tenantId: string): Promise<number> {
    await this.ensureConnected();
    const version = await this.client.get(this.versionKey(tenantId));
    return Number(version ?? '1') || 1;
  }

  async get(tenantId: string, query: string): Promise<T | null> {
    await this.ensureConnected();
    const version = await this.tenantVersion(tenantId);
    const entry = await this.client.get(this.searchKey(tenantId, query, version));
    if (!entry) {
      return null;
    }

    return JSON.parse(entry) as T;
  }

  async set(tenantId: string, query: string, value: T, ttlMs: number): Promise<void> {
    await this.ensureConnected();
    const version = await this.tenantVersion(tenantId);
    await this.client.set(this.searchKey(tenantId, query, version), JSON.stringify(value), {
      PX: ttlMs
    });
  }

  async invalidateTenant(tenantId: string): Promise<void> {
    await this.ensureConnected();
    await this.client.incr(this.versionKey(tenantId));
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.ensureConnected();
      await this.client.ping();
      return true;
    } catch {
      return false;
    }
  }
}
