export class RateLimitService {
  private readonly windows = new Map<string, { count: number; resetAt: number }>();

  allow(key: string, windowMs: number, maxRequests: number): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const current = this.windows.get(key);

    if (!current || now >= current.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true };
    }

    if (current.count >= maxRequests) {
      return { allowed: false, retryAfterMs: Math.max(0, current.resetAt - now) };
    }

    current.count += 1;
    return { allowed: true };
  }
}
