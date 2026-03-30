# Job Search Service Prototype

This repository contains a lightweight TypeScript prototype for a multi-tenant job posting search service.

## Stack

- TypeScript
- Express
- MySQL 8.4 for job posting storage
- Elasticsearch 9.3 for free-text search and relevance ranking
- Redis for repeated search queries
- In-memory tenant rate limiting

## Run With Docker

This is the recommended clone-and-run path for a fresh machine.

```bash
npm run compose:up
```

That starts:
- Redis in a container
- Elasticsearch in a container
- MySQL 8.4 in a container
- the API in a container

The API container uses `--docker`, which makes the Redis host resolve to the `redis` compose service, the MySQL host resolve to the `mysql` compose service, and the Elasticsearch host resolve to the `elasticsearch` compose service.
The MySQL container also loads `db/init/001_create_documents.sql` on first startup.
The Elasticsearch index is created automatically by the API on first use.

## Verify Services

After the stack is up, you can check each dependency directly:

```bash
docker compose exec redis redis-cli ping
docker compose exec mysql mysql -udocument_user -pdocument_pass document_search -e "SELECT COUNT(*) AS job_count FROM job_postings;"
curl http://localhost:9200
curl "http://localhost:9200/job_postings_v2/_search?pretty"
```

You can also inspect cached search keys for a tenant:

```bash
docker compose exec redis redis-cli keys 'tenant-a:search:*'
```

## Endpoints

- `POST /documents`
- `GET /search?q={query}&tenant={tenantId}`
- `GET /documents/{id}`
- `DELETE /documents/{id}`
- `GET /health`

## Tenant Resolution

The service accepts tenant identity via:

- `x-tenant-id` header
- `tenant` query parameter

The header takes precedence.

See [`docs/api-contract.md`](docs/api-contract.md) for the detailed request and response contract.

## Postman

Import [`postman/document-search-service.postman_environment.json`](postman/document-search-service.postman_environment.json) into Postman to try the allowed requests.
