'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { socialNetworks, type SocialNetwork } from '@fact-lens/contracts';
import { announce } from '@/lib/announce';
import { bff } from '@/lib/client';
import { buttonClass, Field, inputClass, Notice } from './ui';

const names: Record<SocialNetwork, string> = { facebook: 'Facebook', youtube: 'YouTube', x: 'X', instagram: 'Instagram', linkedin: 'LinkedIn' };
const examples: Record<SocialNetwork, string> = {
  facebook: 'https://www.facebook.com/yourpage', youtube: 'https://www.youtube.com/@yourchannel', x: 'https://x.com/youraccount',
  instagram: 'https://www.instagram.com/youraccount', linkedin: 'https://www.linkedin.com/company/yourcompany',
};

/** The accounts the footer and the menu link to. A network left empty keeps the site's default link (the network's front page). */
export function SocialLinksForm({ links }: { links: Record<SocialNetwork, string | null> }) {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; issues: string[] } | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setError(null);
        setSaved(false);
        start(async () => {
          const body = Object.fromEntries(socialNetworks.map((n) => [n, String(form.get(n) ?? '').trim() || null]));
          const res = await bff('PUT', 'config/social-links', body);
          if (!res.ok) return setError({ message: res.reason === 'mfa_required' ? 'This step needs a sign-in with a second factor.' : res.message, issues: res.issues });
          announce('Saved');
          setSaved(true);
          router.refresh();
        });
      }}
    >
      {socialNetworks.map((n) => (
        <Field key={n} label={names[n]}>
          <input name={n} type="url" defaultValue={links[n] ?? ''} placeholder={examples[n]} maxLength={300} className={inputClass} />
        </Field>
      ))}
      {error ? <Notice kind="error" message={error.message} issues={error.issues} /> : null}
      {saved ? <Notice kind="ok" message="Saved. The public site picks it up within a minute." /> : null}
      <button type="submit" disabled={pending} className={buttonClass('primary')}>{pending ? 'Saving…' : 'Save social links'}</button>
    </form>
  );
}
