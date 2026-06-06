'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { Plus, Users, Trash2, Edit2 } from 'lucide-react';
import Link from 'next/link';

interface Group {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  createdAt: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demo
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Class 10-A',
      description: 'Science section',
      memberCount: 32,
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Class 10-B',
      description: 'Commerce section',
      memberCount: 28,
      createdAt: '2024-01-15'
    },
    {
      id: '3',
      name: 'Class 9-Advanced',
      description: 'Advanced learners group',
      memberCount: 15,
      createdAt: '2024-02-01'
    }
  ];

  useEffect(() => {
    // In production, fetch from API
    setGroups(mockGroups);
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newGroup: Group = {
        id: Math.random().toString(36),
        name: formData.name,
        description: formData.description,
        memberCount: 0,
        createdAt: new Date().toISOString()
      };

      setGroups([newGroup, ...groups]);
      setFormData({ name: '', description: '' });
      setShowForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter((g) => g.id !== id));
  };

  return (
    <DashboardShell breadcrumb="Groups" backHref="/assignments" showFloatingAdd={false}>
      <div className="groups-container">
        <div className="groups-header">
          <div>
            <h1>Teacher Groups & Classroom Cohorts</h1>
            <p>Organize your classes and manage student groups for better assessment distribution</p>
          </div>
          <button
            className="primary-pill dark"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} />
            <span>New Group</span>
          </button>
        </div>

        {showForm && (
          <form className="group-form" onSubmit={handleCreateGroup}>
            <div className="form-field">
              <label>Group Name</label>
              <input
                type="text"
                placeholder="e.g., Class 10-A"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea
                placeholder="e.g., Science section with 32 students"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-pill dark" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Group'}
              </button>
              <button
                type="button"
                className="secondary-pill light"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="groups-grid">
          {groups.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <h2>No groups yet</h2>
              <p>Create your first group to organize your classroom cohorts</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.id} className="group-card">
                <div className="group-header-content">
                  <div>
                    <h3>{group.name}</h3>
                    <p className="group-description">{group.description}</p>
                  </div>
                  <div className="group-actions">
                    <button className="icon-button" title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      title="Delete"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="group-meta">
                  <span className="member-count">
                    <Users size={14} />
                    {group.memberCount} members
                  </span>
                  <span className="created-date">
                    Created {new Date(group.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="group-actions-footer">
                  <Link href={`/assignments?group=${group.id}`} className="secondary-pill light">
                    View Assignments
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .groups-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .groups-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .groups-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .groups-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .group-form {
          background: var(--panel-2);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field label {
          font-weight: 600;
          font-size: 14px;
          color: var(--ink);
        }

        .form-field input,
        .form-field textarea {
          padding: 10px 14px;
          border: 1px solid var(--panel-3);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-family: inherit;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(255, 106, 61, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .group-card {
          background: var(--panel-2);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: box-shadow 0.2s;
        }

        .group-card:hover {
          box-shadow: var(--shadow-md);
        }

        .group-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .group-header-content h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .group-description {
          font-size: 13px;
          color: var(--muted);
          margin: 4px 0 0 0;
        }

        .group-actions {
          display: flex;
          gap: 8px;
        }

        .icon-button {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted-2);
          background: var(--panel-3);
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .icon-button:hover {
          background: var(--panel);
          color: var(--ink);
        }

        .icon-button.danger {
          color: var(--danger);
        }

        .icon-button.danger:hover {
          background: rgba(255, 77, 77, 0.1);
        }

        .group-meta {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--muted);
        }

        .member-count,
        .created-date {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .group-actions-footer {
          padding-top: 12px;
          border-top: 1px solid var(--panel-3);
        }

        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 20px;
          color: var(--muted);
        }

        .empty-state svg {
          color: var(--muted-2);
          opacity: 0.5;
        }

        .empty-state h2 {
          font-size: 18px;
          margin: 0;
        }

        .empty-state p {
          font-size: 14px;
          margin: 0;
        }

        @media (max-width: 768px) {
          .groups-header {
            flex-direction: column;
          }

          .groups-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions button {
            width: 100%;
          }
        }
      `}</style>
    </DashboardShell>
  );
}
