'use client';

import { useEffect, useState } from 'react';
import { Download, Sparkles, RefreshCw } from 'lucide-react';
import { DashboardShell } from '@/components/DashboardShell';
import { PaperDocument } from '@/components/PaperDocument';
import { getAssignment, getPdfUrl, regenerateAssignment } from '@/lib/api';
import type { AssignmentRecord } from '@/shared/assignment';
import { useParams } from 'next/navigation';

function LoadingPaper() {
  return (
    <section className="paper-loading">
      <div className="loader-card">
        <span className="loader-dot" />
        <h2>Generating the question paper</h2>
        <p>The queue is structuring sections, questions, and PDF output now.</p>
      </div>
    </section>
  );
}

export default function AssignmentOutputPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [assignment, setAssignment] = useState<AssignmentRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subjectLabel = assignment?.subject ?? 'Science';
  const rawClassLabel = assignment?.className ?? '5th';
  const classLabel = rawClassLabel.replace(/[^0-9]/g, '') || rawClassLabel;

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      try {
        const record = await getAssignment(id);
        if (alive) {
          setAssignment(record);
        }
      } catch {
        // Let the loading card remain visible until the backend catches up.
      }
    }

    void hydrate();
    const interval = window.setInterval(() => {
      void hydrate().catch(() => undefined);
    }, 3000);

    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [id]);

  if (!id) {
    return null;
  }

  return (
    <DashboardShell breadcrumb="Create New" backHref="/assignments" showFloatingAdd={false}>
      <div className="output-layout">
        <section className="output-hero">
          <div>
            <p>
              Certainly, Lakshay! Here are customized Question Paper for your CBSE Grade {classLabel} {subjectLabel}{' '}
              classes on the NCERT chapters:
            </p>
          </div>
          <div className="output-actions">
            <a
              className={`secondary-pill light${assignment?.pdfReady ? '' : ' is-disabled'}`}
              href={assignment?.pdfReady ? getPdfUrl(id) : undefined}
              target={assignment?.pdfReady ? '_blank' : undefined}
              rel={assignment?.pdfReady ? 'noreferrer' : undefined}
              aria-disabled={!assignment?.pdfReady}
              onClick={(event) => {
                if (!assignment?.pdfReady) {
                  event.preventDefault();
                }
              }}
            >
              <Download size={15} />
              <span>Download as PDF</span>
            </a>
            <button
              type="button"
              className="secondary-pill light"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  const updated = await regenerateAssignment(id);
                  setAssignment(updated);
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
            >
              <RefreshCw size={15} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Regenerating...' : 'Regenerate'}</span>
            </button>
          </div>
        </section>

        {assignment?.generatedPaper ? <PaperDocument paper={assignment.generatedPaper} /> : <LoadingPaper />}
      </div>
    </DashboardShell>
  );
}
