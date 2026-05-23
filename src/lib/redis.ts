import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let redis: Redis | null = null;

export function getRedis() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN
    });
  }

  return redis;
}
