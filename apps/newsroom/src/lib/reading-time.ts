export function parseOverride(raw: string): number | null {
  if (!raw.trim()) return null;
  const value = Number(raw);
  return Number.isInteger(value) ? value : Number.NaN;
}

export function overrideWarning(entered: number | null, auto: number | null | undefined): boolean {
  return entered !== null && auto !== null && auto !== undefined && Number.isFinite(entered) && Number.isFinite(auto)
    && Math.abs(entered - auto) > auto / 2;
}

export function autoHint(auto: number | null | undefined): string | null {
  return auto === null || auto === undefined ? null : `Auto: ${auto} min`;
}
