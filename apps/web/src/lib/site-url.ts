export function siteUrl(): string | null {
  const value = process.env.PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return value;
  } catch {
    return null;
  }
}

export function siteOrigin(): string | null {
  return siteUrl() ?? (process.env.NODE_ENV === "production" ? null : "http://localhost:3000");
}
