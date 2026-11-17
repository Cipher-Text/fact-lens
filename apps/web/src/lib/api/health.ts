type ApiHealthOptions = {
  base: string;
  fetchImpl?: typeof fetch;
  now?: () => number;
  ttlMs?: number;
  timeoutMs?: number;
};

export function createApiHealth({
  base,
  fetchImpl = fetch,
  now = Date.now,
  ttlMs = 10_000,
  timeoutMs = 1_000,
}: ApiHealthOptions): { isUp(): Promise<boolean> } {
  let cached: { value: boolean; expiresAt: number } | undefined;
  let inFlight: Promise<boolean> | undefined;

  return {
    isUp() {
      const time = now();
      if (cached && time < cached.expiresAt) return Promise.resolve(cached.value);
      if (inFlight) return inFlight;

      const signal = AbortSignal.timeout(timeoutMs);
      let timeout: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("API health check timed out")), timeoutMs);
      });
      inFlight = Promise.race([
        fetchImpl(`${base.replace(/\/$/, "")}/health/ready`, { method: "GET", signal }),
        timedOut,
      ])
        .then((response) => response.ok)
        .catch(() => false)
        .then((value) => {
          cached = { value, expiresAt: now() + ttlMs };
          return value;
        })
        .finally(() => {
          if (timeout !== undefined) clearTimeout(timeout);
          inFlight = undefined;
        });
      return inFlight;
    },
  };
}
