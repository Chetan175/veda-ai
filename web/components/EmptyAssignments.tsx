'use client';

import Link from 'next/link';

export function EmptyAssignments() {
  return (
    <section className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <svg viewBox="0 0 240 240" fill="none">
          <circle cx="120" cy="120" r="78" fill="#f4f3f2" />
          <rect x="78" y="56" width="68" height="124" rx="13" fill="#ffffff" stroke="#dcd9d6" strokeWidth="3" />
          <rect x="90" y="75" width="46" height="8" rx="4" fill="#1f2f3c" />
          <rect x="90" y="95" width="32" height="8" rx="4" fill="#d8d6d4" />
          <rect x="90" y="113" width="42" height="8" rx="4" fill="#d8d6d4" />
          <rect x="90" y="131" width="34" height="8" rx="4" fill="#d8d6d4" />
          <circle cx="137" cy="123" r="34" fill="#ffffff" stroke="#d8d0e4" strokeWidth="5" />
          <line x1="160" y1="146" x2="184" y2="170" stroke="#d8d0e4" strokeWidth="8" strokeLinecap="round" />
          <line x1="126" y1="112" x2="150" y2="136" stroke="#ff6052" strokeWidth="9" strokeLinecap="round" />
          <line x1="150" y1="112" x2="126" y2="136" stroke="#ff6052" strokeWidth="9" strokeLinecap="round" />
          <path d="M74 72 C52 84, 58 116, 78 124" stroke="#1f2f3c" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M96 192 L102 182 L108 192 L102 202 Z" fill="#4a84c5" />
          <circle cx="184" cy="122" r="4" fill="#4a84c5" />
        </svg>
      </div>
      <h2>No assignments yet</h2>
      <p>
        Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
        define marking criteria, and let AI assist with grading.
      </p>
      <Link href="/assignments/new" className="primary-pill">
        + Create Your First Assignment
      </Link>
    </section>
  );
}
