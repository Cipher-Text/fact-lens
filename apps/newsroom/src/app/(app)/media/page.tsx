import { Panel } from '@/components/ui';

export const metadata = { title: 'Media library' };

export default function Page() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Media library</h1>
      <Panel title="Not built yet" id="nb">
        <p className="text-sm text-muted">Search, upload, rights and branded photocards will appear here (planned for Phase 2 of the media work).</p>
      </Panel>
    </div>
  );
}
