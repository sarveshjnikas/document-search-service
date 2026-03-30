export function resolveRedisConfig() {
  const isDocker = process.argv.includes('--docker');

  return {
    url: isDocker ? 'redis://redis:6379' : 'redis://127.0.0.1:6379'
  } as const;
}

export const redisConfig = {
  url: 'redis://127.0.0.1:6379'
} as const;
