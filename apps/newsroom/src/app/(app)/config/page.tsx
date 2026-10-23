import { z } from 'zod';
import { featureFlagSchema, localeSchema, socialNetworks, type SocialNetwork } from '@fact-lens/contracts';
import { FlagToggle } from '@/components/NewsActions';
import { SocialLinksForm } from '@/components/SiteParts';
import { LanguageManager } from '@/components/TaxonomyParts';
import { AccessProblem, Badge, Empty, Panel } from '@/components/ui';
import { ApiError, api, getPrincipal, isMfaRequired } from '@/lib/current';
import { formatDateTime } from '@/lib/format';
import { can } from '@/lib/nav';

export const metadata = { title: 'Configuration' };

export default async function ConfigPage() {
  const principal = await getPrincipal();
  if (!can(principal, 'config.manage')) {
    return <Empty>You do not have permission to change configuration.</Empty>;
  }
  let flags, locales, social;
  try {
    [flags, locales, social] = await Promise.all([
      api('/config/flags', z.array(featureFlagSchema), { returnTo: '/config' }),
      api('/config/locales', z.array(localeSchema), { returnTo: '/config' }),
      api('/config/social-links', z.record(z.enum(socialNetworks), z.string().nullable()), { returnTo: '/config' }),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return <AccessProblem mfaRequired={isMfaRequired(err)} />;
    throw err;
  }
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Configuration</h1>
      <Panel title="Languages" id="languages-h">
        <p className="mb-3 text-sm text-muted">The languages the site can be published in. A new language can be used straight away for names of sections and tags and for news translations; the public site needs its own interface text added separately.</p>
        <LanguageManager locales={locales} />
      </Panel>
      <Panel title="Social links" id="social-h">
        <p className="mb-3 text-sm text-muted">The accounts the public site&apos;s footer and menu link to. Leave a network empty to keep the default link, which is that network&apos;s front page. An address must be an https address on the network&apos;s own site.</p>
        <SocialLinksForm links={social as Record<SocialNetwork, string | null>} />
      </Panel>
      <section aria-labelledby="flags-h">
      <h2 id="flags-h" className="mb-1 text-sm font-semibold uppercase tracking-wide text-muted">Feature flags</h2>
      <p className="mb-4 text-sm text-muted">Feature flags switch whole modules on or off. Every change needs a reason and is recorded in the audit trail.</p>
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
      </section>
    </div>
  );
}
