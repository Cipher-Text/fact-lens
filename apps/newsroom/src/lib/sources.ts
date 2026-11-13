import type { NewsSourceAttach, SourceValidation } from '@fact-lens/contracts';

export function buildAttachBody(relation: string, useType: string, notes: string): NewsSourceAttach {
  return {
    relation: relation as NewsSourceAttach['relation'],
    useType: useType as NewsSourceAttach['useType'],
    ...(notes.trim() ? { notes: notes.trim() } : {}),
  };
}

export function buildValidation(status: SourceValidation['status'], reason: string): SourceValidation | null {
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 500) return null;
  return { status, reason: trimmed };
}
