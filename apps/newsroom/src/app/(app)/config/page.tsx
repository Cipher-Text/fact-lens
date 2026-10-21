import { z } from 'zod';
import { featureFlagSchema } from '@fact-lens/contracts';
import { FlagToggle } from '@/components/StoryActions';
import { AccessProblem, Badge, Empty } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { can } from '@/lib/nav';

export const metadata = { title: 'Configuration' };

export default async function ConfigPage() {
  const principal = await getPrincipal();
  if (!can(principal, 'config.manage')) {
    return <Empty>You do not have permission to change configuration.</Empty>;
  }
  let flags;
  try {
    flags = await api('/config/flags', z.array(featureFlagSchema), { returnTo: '/config' });
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Configuration</h1>
      <p className="mb-4 mt-1 text-sm text-muted">Feature flags switch whole modules on or off. Every change needs a reason and is recorded in the audit trail.</p>
      <ul className="space-y-3">
        {flags.map((f) => (
          <li key={f.key} className="rounded-lg border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <code className="font-medium">{f.key}</code>
              <Badge tone={f.enabled ? 'good' : 'neutral'}>{f.enabled ? 'On' : 'Off'}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{f.description}</p>
            <p className="text-xs text-muted">Last changed {formatDateTime(f.updatedAt)}</p>
            <FlagToggle flagKey={f.key} enabled={f.enabled} />
          </li>
        ))}
      </ul>
    </div>
  );
}
