export function mediaRewrites(apiBase: string | null) {
  if (apiBase === null) return [];

  const base = apiBase.replace(/\/$/, "");
  return {
    beforeFiles: [
      {
        source: "/public/media/:path*",
        destination: `${base}/public/media/:path*`,
      },
    ],
  };
}
