# API Contract

This document defines the public HTTP contract for the job posting search service.

## Overview

- Base URL: `/`
- Transport: HTTPS in production, HTTP for local development
- Content type: `application/json`
- Tenant identity: `x-tenant-id` header preferred, `tenant` query parameter accepted as a fallback
- ID format: UUID string
- Timestamp format: ISO 8601
- Response envelope:

```json
{
  "error": false,
  "statusCode": 200,
  "data": {}
}
```

## Common Object Model

### JobPosting

```ts
{
  id: string;
  tenantId: string;
  name: string;
  employmentType: 'full_time' | 'part_time' | 'contractual';
  isRemote: boolean;
  details: string;
  minSalary: number;
  maxSalary: number;
  location: string;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### SearchResult

```ts
{
  id: string;
  tenantId: string;
  name: string;
  employmentType: 'full_time' | 'part_time' | 'contractual';
  isRemote: boolean;
  details: string;
  minSalary: number;
  maxSalary: number;
  location: string;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
  score?: number;
}
```

### ErrorResponse

```ts
{
  error: true;
  statusCode: number;
  message: string;
  details?: unknown;
}
```

## Tenant Rules

- Every request is scoped to a tenant.
- The API rejects requests without tenant context.
- The tenant is used consistently in MySQL queries, Elasticsearch documents, and cache keys.
- A tenant can only read, search, update, or delete its own job postings.

## `POST /documents`

Create a new job posting.

### Headers

- `content-type: application/json`
- `x-tenant-id: tenant-a`

### Request Body

```json
{
  "name": "Senior Backend Engineer",
  "employmentType": "full_time",
  "isRemote": true,
  "details": "Build and scale a distributed job search platform.",
  "minSalary": 120000,
  "maxSalary": 180000,
  "location": "Bengaluru",
  "companyName": "Acme"
}
```

### Field Validation

- `name`
  - required
  - string
  - 1 to 255 characters
- `employmentType`
  - required
  - one of `full_time`, `part_time`, `contractual`
- `isRemote`
  - required
  - boolean
- `details`
  - required
  - string
  - non-empty
- `minSalary`
  - required
  - number
  - must be greater than or equal to `0`
- `maxSalary`
  - required
  - number
  - must be greater than or equal to `minSalary`
- `location`
  - required
  - string
  - non-empty
- `companyName`
  - optional
  - string or null

### Success Response

Status: `201 Created`

```json
{
  "error": false,
  "statusCode": 201,
  "data": {
    "id": "c363b623-b042-43d2-ace7-a3977742c505",
    "tenantId": "tenant-a",
    "name": "Senior Backend Engineer",
    "employmentType": "full_time",
    "isRemote": true,
    "details": "Build and scale a distributed job search platform.",
    "minSalary": 120000,
    "maxSalary": 180000,
    "location": "Bengaluru",
    "companyName": "Acme",
    "createdAt": "2026-03-30T15:13:31Z",
    "updatedAt": "2026-03-30T15:13:31Z"
  }
}
```

### Error Responses

- `400 Bad Request`
```json
{
  "error": true,
  "statusCode": 400,
  "message": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "name is required"
    }
  ]
}
```

- `400 Bad Request`
```json
{
  "error": true,
  "statusCode": 400,
  "message": "Tenant is required"
}
```

- `500 Internal Server Error`
```json
{
  "error": true,
  "statusCode": 500,
  "message": "Internal server error"
}
```

## `GET /search?q={query}&tenant={tenantId}`

Search job postings for a tenant.

### Query Parameters

- `q`
  - required
  - string
  - search terms
- `tenant`
  - required if `x-tenant-id` is not provided
  - string

### Example Request

```bash
GET /search?q=distributed backend&tenant=tenant-a
```

### Success Response

Status: `200 OK`

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "query": "distributed backend",
    "tenantId": "tenant-a",
    "total": 1,
    "items": [
      {
        "id": "c363b623-b042-43d2-ace7-a3977742c505",
        "tenantId": "tenant-a",
        "name": "Senior Backend Engineer",
        "employmentType": "full_time",
        "isRemote": true,
        "details": "Build and scale a distributed job search platform.",
        "minSalary": 120000,
        "maxSalary": 180000,
        "location": "Bengaluru",
        "companyName": "Acme",
        "createdAt": "2026-03-30T15:13:31Z",
        "updatedAt": "2026-03-30T15:13:31Z",
        "score": 1.92
      }
    ]
  }
}
```

### Behavior

- Search results are tenant-scoped.
- The current prototype uses Redis for repeated queries.
- Elasticsearch is the search index and returns relevance-ranked free-text matches.
- Search is synchronous in the current prototype, so writes index directly into Elasticsearch.
- If Elasticsearch is temporarily unavailable, create and delete requests may fail because indexing happens in the request path.

### Error Responses

- `400 Bad Request` if `q` is missing
- `400 Bad Request` if tenant is missing
- `500 Internal Server Error` if the search backend is unavailable

## `GET /documents/{id}`

Retrieve a single job posting.

### Headers

- `x-tenant-id: tenant-a`

### Example Request

```bash
GET /documents/c363b623-b042-43d2-ace7-a3977742c505
```

### Success Response

Status: `200 OK`

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "id": "c363b623-b042-43d2-ace7-a3977742c505",
    "tenantId": "tenant-a",
    "name": "Senior Backend Engineer",
    "employmentType": "full_time",
    "isRemote": true,
    "details": "Build and scale a distributed job search platform.",
    "minSalary": 120000,
    "maxSalary": 180000,
    "location": "Bengaluru",
    "companyName": "Acme",
    "createdAt": "2026-03-30T15:13:31Z",
    "updatedAt": "2026-03-30T15:13:31Z"
  }
}
```

### Error Responses

- `400 Bad Request` if tenant is missing
- `404 Not Found` if the record does not exist for that tenant

```json
{
  "error": true,
  "statusCode": 404,
  "message": "Job posting not found"
}
```

## `DELETE /documents/{id}`

Delete a job posting.

### Headers

- `x-tenant-id: tenant-a`

### Example Request

```bash
DELETE /documents/c363b623-b042-43d2-ace7-a3977742c505
```

### Success Response

Status: `204 No Content`

No body is returned.

### Behavior

- The delete is tenant-scoped.
- The source of truth record is removed from MySQL.
- The Redis cache should be invalidated for tenant-scoped search keys.
- If Elasticsearch is enabled, a delete event should be published for asynchronous index removal.

### Error Responses

- `400 Bad Request` if tenant is missing
- `404 Not Found` if the record does not exist for that tenant

## `GET /health`

Check service and dependency health.

### Success Response

Status: `200 OK`

```json
{
  "error": false,
  "statusCode": 200,
  "data": {
    "service": "up",
    "mysql": "up",
    "elasticsearch": "up",
    "redis": "up"
  }
}
```

### Partial Failure Response

Status: `503 Service Unavailable`

```json
{
  "error": true,
  "statusCode": 503,
  "data": {
    "service": "up",
    "mysql": "down",
    "elasticsearch": "up",
    "redis": "down"
  }
}
```

### Notes

- The prototype may only report dependencies that are currently configured.
- The health endpoint should reflect the live state of the critical dependencies.

## Error Contract

All endpoints should use the same error structure.

### Validation Error

```json
{
  "error": true,
  "statusCode": 400,
  "message": "Validation failed",
  "details": [
    {
      "field": "minSalary",
      "message": "minSalary must be greater than or equal to 0"
    }
  ]
}
```

### Authorization Error

```json
{
  "error": true,
  "statusCode": 403,
  "message": "Access denied for tenant"
}
```

### Not Found

```json
{
  "error": true,
  "statusCode": 404,
  "message": "Job posting not found"
}
```

### Server Error

```json
{
  "error": true,
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Operational Notes

- Writes should target MySQL first because it is the source of truth.
- Search indexing should be asynchronous when Elasticsearch is introduced.
- Search cache keys must include tenant identity and query text.
- Queue messages should include document id, tenant id, and operation type so workers can be idempotent.
- Reads by id should come from the source of truth, not the search index.
