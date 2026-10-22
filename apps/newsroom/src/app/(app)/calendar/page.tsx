import { Panel } from '@/components/ui';

export const metadata = { title: 'Publishing calendar' };

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Publishing calendar</h1>
      <Panel title="Not built yet" id="nb">
        <p className="text-sm text-muted">Schedules, locale readiness and failed publish jobs will appear here. Scheduling already works from the news item page.</p>
      </Panel>
    </div>
  );
}
