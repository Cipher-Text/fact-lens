export const MAX_TERMS = 6;
export const MAX_TERM = 60;

export function addTerm(terms: string[], raw: string): string[] {
  const term = raw.trim();
  if (!term || terms.length >= MAX_TERMS || terms.some((existing) => existing.toLocaleLowerCase() === term.toLocaleLowerCase())) return terms;
  return [...terms, term];
}

export function removeTerm(terms: string[], index: number): string[] {
  if (index < 0 || index >= terms.length) return terms;
  return terms.filter((_, current) => current !== index);
}

export function moveTerm(terms: string[], index: number, direction: 'up' | 'down'): string[] {
  const neighbour = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || index >= terms.length || neighbour < 0 || neighbour >= terms.length) return terms;
  const moved = [...terms];
  [moved[index], moved[neighbour]] = [moved[neighbour]!, moved[index]!];
  return moved;
}

export function validateTerms(terms: string[]): string | null {
  if (terms.length > MAX_TERMS) return `Use no more than ${MAX_TERMS} terms.`;
  const seen = new Set<string>();
  for (const term of terms) {
    if (term.length > MAX_TERM) return `Each term must be ${MAX_TERM} characters or fewer.`;
    const key = term.toLocaleLowerCase();
    if (seen.has(key)) return `“${term}” is listed twice.`;
    seen.add(key);
  }
  return null;
}
