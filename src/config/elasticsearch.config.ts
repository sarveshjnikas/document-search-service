export function resolveElasticsearchConfig() {
  const isDocker = process.argv.includes('--docker');

  return {
    url: isDocker ? 'http://elasticsearch:9200' : 'http://127.0.0.1:9200',
    indexName: 'job_postings_v2'
  } as const;
}

export const elasticsearchConfig = {
  url: 'http://127.0.0.1:9200',
  indexName: 'job_postings_v2'
} as const;
