import { Panel } from '@/components/ui';

export const metadata = { title: 'Source inbox' };

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Source inbox</h1>
      <Panel title="Not built yet" id="nb">
        <p className="text-sm text-muted">Ingested items, duplicates and triage will appear here once feeds and Telegram channels are connected (planned for Phase 5).</p>
      </Panel>
    </div>
  );
}
