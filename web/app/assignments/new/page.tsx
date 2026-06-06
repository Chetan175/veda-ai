'use client';

import { DashboardShell } from '@/components/DashboardShell';
import { AssignmentForm } from '@/components/AssignmentForm';

export default function NewAssignmentPage() {
  return (
    <DashboardShell breadcrumb="Assignment" backHref="/assignments" showFloatingAdd={false}>
      <AssignmentForm />
    </DashboardShell>
  );
}
