'use client';

import Link from 'next/link';

export function PlaceholderPage({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="placeholder-page">
      <div className="placeholder-card">
        <h1>{title}</h1>
        <p>{description}</p>
        <Link href="/assignments" className="primary-pill dark">
          Back to assignments
        </Link>
      </div>
    </section>
  );
}
