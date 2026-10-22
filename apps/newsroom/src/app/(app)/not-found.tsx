import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-semibold">Not found</h1>
      <p className="mt-1 text-muted">That news item or page does not exist, or you cannot see it.</p>
      <Link href="/" className="mt-3 inline-block underline">Back to the desk queue</Link>
    </div>
  );
}
