import { getDictionary } from "@/i18n";
import { localizedPath, type Lang } from "@/i18n/config";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export function unavailableHtml(lang: Lang): string {
  const { unavailable, header } = getDictionary(lang);
  const home = localizedPath(lang, "/");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(unavailable.title)}</title><style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:4rem auto;padding:0 1rem;line-height:1.5}</style></head><body><main><h1>${escapeHtml(unavailable.title)}</h1><p>${escapeHtml(unavailable.body)}</p><a href="${home}">${escapeHtml(header.navHome)}</a></main></body></html>`;
}
