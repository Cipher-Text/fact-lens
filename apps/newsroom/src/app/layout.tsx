import type { Metadata } from 'next';
import { themeScript } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Fact Lens Newsroom', template: '%s · Fact Lens Newsroom' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script changes <html> before React loads, so React must not complain about it.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
