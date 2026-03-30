export const appConfig = {
  name: 'document-search-service',
  port: 3000,
  tenantHeader: 'x-tenant-id',
  tenantQueryParam: 'tenant',
  searchCacheTtlMs: 15_000,
  rateLimit: {
    windowMs: 60_000,
    maxRequestsPerWindow: 120
  }
} as const;
