/**
 * Headers for every public page (ADR-062). The content security policy restricts framing, the base URL, plugins and
 * form targets. It does not restrict scripts yet: the page has inline scripts that Next.js needs, so a script policy
 * waits for per-request nonces from the proxy.
 */
export const publicSecurityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];
