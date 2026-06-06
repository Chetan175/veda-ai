'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import type { AssignmentRecord } from '@/shared/assignment';
import { useRouter } from 'next/navigation';

type AssignmentCardProps = {
  record: AssignmentRecord;
  onDelete: (id: string) => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

export function AssignmentCard({ record, onDelete }: AssignmentCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('click', onDocumentClick);
    return () => document.removeEventListener('click', onDocumentClick);
  }, []);

  return (
    <article
      className="assignment-card"
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/assignments/${record.id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          router.push(`/assignments/${record.id}`);
        }
      }}
    >
      <div className="assignment-card-head">
        <h3>{record.title}</h3>
        <div className="assignment-menu" ref={menuRef}>
          <button
            type="button"
            className="icon-only-button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((value) => !value);
            }}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen ? (
            <div className="assignment-menu-popover">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  router.push(`/assignments/${record.id}`);
                }}
              >
                View Assignment
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  onDelete(record.id);
                }}
                className="danger"
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="assignment-card-meta">
        <span>
          <strong>Assigned on</strong> {formatDate(record.createdAt)}
        </span>
        <span>
          <strong>Due</strong> {formatDate(record.dueDate)}
        </span>
      </div>
    </article>
  );
}
