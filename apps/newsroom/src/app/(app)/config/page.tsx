import { z } from 'zod';
import { featureFlagSchema, localeSchema } from '@fact-lens/contracts';
import { FlagToggle } from '@/components/NewsActions';
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
  let flags, locales;
  try {
    [flags, locales] = await Promise.all([
      api('/config/flags', z.array(featureFlagSchema), { returnTo: '/config' }),
      api('/config/locales', z.array(localeSchema), { returnTo: '/config' }),
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
      <Panel title="Site social links and contact" id="site-h">
        <p className="text-sm text-muted">
          The public site&apos;s social accounts and contact details are deployment settings, not something edited here. They come from the API&apos;s environment
          (<code>SITE_SOCIAL_FACEBOOK_URL</code>, <code>SITE_SOCIAL_YOUTUBE_URL</code>, <code>SITE_SOCIAL_X_URL</code>, <code>SITE_SOCIAL_INSTAGRAM_URL</code>,{' '}
          <code>SITE_SOCIAL_LINKEDIN_URL</code>, <code>SITE_CONTACT_EMAIL</code>, <code>SITE_CONTACT_PHONE</code>, <code>SITE_CONTACT_ADDRESS</code>), and a
          change needs a new start. A network with no address keeps the site&apos;s default link. A person&apos;s own social links are set under People.
        </p>
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
