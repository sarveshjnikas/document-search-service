export interface SearchCache<T> {
  get(tenantId: string, query: string): Promise<T | null>;
  set(tenantId: string, query: string, value: T, ttlMs: number): Promise<void>;
  invalidateTenant(tenantId: string): Promise<void>;
  healthCheck(): Promise<boolean>;
}

export const SEARCH_CACHE = 'SEARCH_CACHE';
