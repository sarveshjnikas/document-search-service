export function resolveDbConfig() {
  const isDocker = process.argv.includes('--docker');

  return {
    host: isDocker ? 'mysql' : '127.0.0.1',
    port: 3306,
    user: 'document_user',
    password: 'document_pass',
    database: 'document_search'
  } as const;
}

export const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'document_user',
  password: 'document_pass',
  database: 'document_search'
} as const;
