// The dev server compiles a route the first time it is requested. Requesting the main pages once before
// the tests start keeps the first test on each page from waiting for that compile.
const WARM_UP_PATHS = ["/", "/en", "/latest", "/en/latest", "/analysis", "/en/analysis"];

export default async function globalSetup(): Promise<void> {
  const baseURL = `http://localhost:3000`;
  for (const path of WARM_UP_PATHS) {
    const response = await fetch(`${baseURL}${path}`, { signal: AbortSignal.timeout(180_000) });
    await response.arrayBuffer();
  }
}
