/** Small, bounded abuse guard for the public order endpoint. No account is created. */
export function createGuestOrderLimiter(now = Date.now) {
  const buckets = new Map<string, { count: number; expiresAt: number }>();
  const windowMs = 15 * 60 * 1000;
  return (ip: string, email: string) => {
    const time = now();
    for (const [key, bucket] of buckets) {
      if (bucket.expiresAt <= time) buckets.delete(key);
    }
    const keys = [
      { key: `ip:${ip}`, limit: 100 },
      { key: `email:${email.trim().toLowerCase()}`, limit: 5 },
    ];
    if (keys.some(({ key, limit }) => (buckets.get(key)?.count ?? 0) >= limit)) {
      return false;
    }
    if (buckets.size >= 10000 && keys.some(({ key }) => !buckets.has(key))) {
      return false;
    }
    for (const { key } of keys) {
      const bucket = buckets.get(key) ?? { count: 0, expiresAt: time + windowMs };
      bucket.count++;
      buckets.set(key, bucket);
    }
    return true;
  };
}
