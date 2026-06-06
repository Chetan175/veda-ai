'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { deleteAssignment } from '@/lib/api';
import { DashboardShell } from '@/components/DashboardShell';
import { AssignmentCard } from '@/components/AssignmentCard';
import { EmptyAssignments } from '@/components/EmptyAssignments';
import { useAssignmentStore } from '@/lib/store';

export default function AssignmentsPage() {
  const assignments = useAssignmentStore((state) => state.assignments);
  const activeFilter = useAssignmentStore((state) => state.activeFilter);
  const searchQuery = useAssignmentStore((state) => state.searchQuery);
  const setSearchQuery = useAssignmentStore((state) => state.setSearchQuery);
  const setActiveFilter = useAssignmentStore((state) => state.setActiveFilter);
  const removeAssignment = useAssignmentStore((state) => state.removeAssignment);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((record) => {
      const matchesFilter = activeFilter === 'all' || record.status === activeFilter;
      const matchesQuery =
        searchQuery.trim().length === 0
          ? true
          : [record.title, record.subject, record.className, record.dueDate]
              .join(' ')
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, assignments, searchQuery]);

  return (
    <DashboardShell breadcrumb="Assignment">
      <section className="page-header">
        <div className="page-heading">
          <span className="status-dot" />
          <div>
            <h1>Assignments</h1>
            <p>Manage and create assignments for your classes.</p>
          </div>
        </div>

        <div className="search-strip">
          <button type="button" className="filter-chip">
            <SlidersHorizontal size={14} />
            <span>Filter By</span>
          </button>

          <div className="search-field">
            <Search size={15} />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Assignment"
            />
          </div>
        </div>

        <div className="status-filters">
          {['all', 'queued', 'generating', 'completed', 'failed'].map((value) => (
            <button
              key={value}
              type="button"
              className={`status-filter${activeFilter === value ? ' is-active' : ''}`}
              onClick={() => setActiveFilter(value as typeof activeFilter)}
            >
              {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {assignments.length === 0 ? (
        <EmptyAssignments />
      ) : filteredAssignments.length === 0 ? (
        <section className="empty-search-state">
          <p>No assignments match your search.</p>
          <Link href="/assignments/new" className="primary-pill dark">
            <Plus size={15} />
            <span>Create Assignment</span>
          </Link>
        </section>
      ) : (
        <section className="assignments-grid-wrap">
          <div className="assignments-grid">
            {filteredAssignments.map((record) => (
              <AssignmentCard
                key={record.id}
                record={record}
                onDelete={async (id) => {
                  if (!window.confirm('Delete this assignment?')) {
                    return;
                  }
                  try {
                    await deleteAssignment(id);
                    removeAssignment(id);
                  } catch (error) {
                    window.alert(error instanceof Error ? error.message : 'Unable to delete assignment.');
                  }
                }}
              />
            ))}
          </div>
          <aside className="note-card">
            <small>Note</small>
            <h2>Created Assignments will appear here</h2>
          </aside>
        </section>
      )}

      {assignments.length > 0 ? (
        <div className="sticky-create-bar">
          <Link href="/assignments/new" className="primary-pill dark">
            <Plus size={15} />
            <span>Create Assignment</span>
          </Link>
        </div>
      ) : null}
    </DashboardShell>
  );
}
