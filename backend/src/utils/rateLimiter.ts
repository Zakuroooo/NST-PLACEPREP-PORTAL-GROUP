/**
 * backend/src/utils/rateLimiter.ts
 * In-memory rate limiter — no Redis required for initial deployment.
 * Uses a sliding window algorithm with automatic cleanup of expired entries.
 * Safe for single-instance Next.js (Vercel serverless functions each have own memory,
 * so this provides per-lambda limiting; add Redis for cross-instance limiting post-V1).
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup interval: remove entries older than 1 hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.windowStart > 60 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000); // run every 5 minutes

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check if a given key (typically IP + endpoint) is within rate limit.
 * Returns { allowed, remaining, resetAt } — never throws.
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + config.windowMs,
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

// Pre-configured rate limit profiles
export const RATE_LIMITS = {
  /** Login: 5 attempts per 15 minutes per IP — brute force protection */
  LOGIN: { maxRequests: 5, windowMs: 15 * 60 * 1000 } satisfies RateLimitConfig,
  /** Standard API: 120 requests per minute per IP */
  API: { maxRequests: 120, windowMs: 60 * 1000 } satisfies RateLimitConfig,
  /** Write operations: 20 per minute per user */
  WRITE: { maxRequests: 20, windowMs: 60 * 1000 } satisfies RateLimitConfig,
  /** Password change: 3 per hour */
  PASSWORD: { maxRequests: 3, windowMs: 60 * 60 * 1000 } satisfies RateLimitConfig,
} as const;

/**
 * Get the client IP from Next.js request headers.
 * Handles Vercel's x-forwarded-for correctly.
 */
export function getClientIp(request: { headers: { get: (k: string) => string | null } }): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can be comma-separated: take the first (client IP)
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
