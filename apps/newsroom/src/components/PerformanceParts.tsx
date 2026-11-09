import type { SourceCounts } from '@fact-lens/contracts';

const SOURCE_NAMES: Record<keyof SourceCounts, string> = { search: 'Search', social: 'Social', direct: 'Direct', internal: 'From the site', other: 'Other' };

/** Views a day as bars, one per day of the period (zeros included), with the peak day marked. */
export function ViewsChart({ series, label }: { series: Array<{ day: string; views: number }>; label: string }) {
  const max = Math.max(1, ...series.map((d) => d.views));
  const width = Math.max(240, series.length * 12);
  const height = 72;
  const gap = 2;
  const bar = (width - gap * (series.length - 1)) / Math.max(1, series.length);
  return (
    <figure>
      <svg role="img" aria-label={label} viewBox={`0 0 ${width} ${height}`} className="h-20 w-full" preserveAspectRatio="none">
        {series.map((d, i) => {
          const h = d.views === 0 ? 1 : Math.max(2, (d.views / max) * (height - 4));
          return (
            <rect key={d.day} x={i * (bar + gap)} y={height - h} width={bar} height={h} className={d.views === 0 ? 'fill-line' : 'fill-accent'}>
              <title>{`${d.day}: ${d.views}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>{series[0]?.day}</span>
        <span>Most in a day: {max === 1 && series.every((d) => d.views === 0) ? 0 : max}</span>
        <span>{series[series.length - 1]?.day}</span>
      </figcaption>
    </figure>
  );
}

/** Where the views came from, as a row of shares. */
export function SourceBars({ sources }: { sources: SourceCounts }) {
  const total = Object.values(sources).reduce((a, b) => a + b, 0);
  if (total === 0) return <p className="text-sm text-muted">No views in this period.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {(Object.keys(SOURCE_NAMES) as Array<keyof SourceCounts>).map((k) => (
        <li key={k} className="flex items-center gap-2">
          <span className="w-28 shrink-0">{SOURCE_NAMES[k]}</span>
          <span className="h-2 grow rounded bg-line" aria-hidden>
            <span className="block h-2 rounded bg-accent" style={{ width: `${Math.round((sources[k] / total) * 100)}%` }} />
          </span>
          <span className="w-20 shrink-0 text-right tabular-nums text-muted">{sources[k]} ({Math.round((sources[k] / total) * 100)}%)</span>
        </li>
      ))}
    </ul>
  );
}
