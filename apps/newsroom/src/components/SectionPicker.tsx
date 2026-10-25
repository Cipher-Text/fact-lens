'use client';

export type SectionOption = { id: string; name: string; parentId: string | null };
export type Sections = { ids: string[]; primary: string | null };

/** The primary section is always one of the chosen ones: it is the first when the old one is unchecked. */
export function toggleSection(value: Sections, id: string): Sections {
  const ids = value.ids.includes(id) ? value.ids.filter((x) => x !== id) : [...value.ids, id];
  return { ids, primary: value.primary && ids.includes(value.primary) ? value.primary : (ids[0] ?? null) };
}

/**
 * The menu sections of a news item: tick every section it belongs to, then pick the main one. The main
 * section is the one the reader's page names first. Sub-menus are indented under their menu.
 */
export function SectionPicker({ options, value, onChange }: { options: SectionOption[]; value: Sections; onChange: (next: Sections) => void }) {
  const rows = options.filter((o) => o.parentId === null).flatMap((o) => [
    { ...o, child: false },
    ...options.filter((k) => k.parentId === o.id).map((k) => ({ ...k, child: true })),
  ]);
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium">Sections</legend>
      <ul className="space-y-1 text-sm">
        {rows.map((o) => {
          const on = value.ids.includes(o.id);
          return (
            <li key={o.id} className={`flex items-center justify-between gap-2 ${o.child ? 'pl-5' : ''}`}>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={on} onChange={() => onChange(toggleSection(value, o.id))} />
                {o.name}
              </label>
              {on && value.ids.length > 1 ? (
                <label className="flex items-center gap-1 text-xs text-muted">
                  <input type="radio" name="primary-section" checked={value.primary === o.id} onChange={() => onChange({ ...value, primary: o.id })} />
                  Main
                </label>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="mt-1 text-xs text-muted">The news item shows in every ticked section. The main one is named first on its page.</p>
    </fieldset>
  );
}
