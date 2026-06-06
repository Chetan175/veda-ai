'use client';

import { useState, useEffect } from 'react';
import { DashboardShell } from '@/components/DashboardShell';
import { Plus, BookOpen, Trash2, Copy, Download, Filter } from 'lucide-react';

interface QuestionBank {
  id: string;
  title: string;
  subject: string;
  questionCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function LibraryPage() {
  const [banks, setBanks] = useState<QuestionBank[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [formData, setFormData] = useState({ title: '', subject: '', tags: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Mock question banks
  const mockBanks: QuestionBank[] = [
    {
      id: '1',
      title: 'Physics - Mechanics (Class 10)',
      subject: 'Physics',
      questionCount: 45,
      tags: ['mechanics', 'class-10', 'easy-medium'],
      createdAt: '2024-01-10',
      updatedAt: '2024-02-15'
    },
    {
      id: '2',
      title: 'Chemistry - Periodic Table',
      subject: 'Chemistry',
      questionCount: 32,
      tags: ['periodic-table', 'class-10', 'medium'],
      createdAt: '2024-01-15',
      updatedAt: '2024-02-10'
    },
    {
      id: '3',
      title: 'Biology - Genetics (Class 12)',
      subject: 'Biology',
      questionCount: 58,
      tags: ['genetics', 'class-12', 'hard'],
      createdAt: '2024-02-01',
      updatedAt: '2024-02-20'
    },
    {
      id: '4',
      title: 'Mathematics - Calculus',
      subject: 'Mathematics',
      questionCount: 67,
      tags: ['calculus', 'class-12', 'hard', 'advanced'],
      createdAt: '2024-01-20',
      updatedAt: '2024-02-18'
    }
  ];

  useEffect(() => {
    setBanks(mockBanks);
  }, []);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const now = new Date().toISOString();
      const newBank: QuestionBank = {
        id: Math.random().toString(36),
        title: formData.title,
        subject: formData.subject,
        questionCount: 0,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        createdAt: now,
        updatedAt: now
      };

      setBanks([newBank, ...banks]);
      setFormData({ title: '', subject: '', tags: '' });
      setShowForm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBank = (id: string) => {
    setBanks(banks.filter((b) => b.id !== id));
  };

  const filteredBanks = banks.filter((bank) => {
    const matchesSearch =
      bank.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || bank.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const subjects = Array.from(new Set(banks.map((b) => b.subject)));

  return (
    <DashboardShell breadcrumb="Library" backHref="/assignments" showFloatingAdd={false}>
      <div className="library-container">
        <div className="library-header">
          <div>
            <h1>Question Banks & Library</h1>
            <p>Save and manage reusable question banks for your assessments</p>
          </div>
          <button className="primary-pill dark" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />
            <span>New Bank</span>
          </button>
        </div>

        {showForm && (
          <form className="bank-form" onSubmit={handleCreateBank}>
            <div className="form-row">
              <div className="form-field full">
                <label>Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g., Physics - Mechanics"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                >
                  <option value="">Select subject</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                </select>
              </div>
              <div className="form-field">
                <label>Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., class-10, mechanics, easy"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-pill dark" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Bank'}
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

        <div className="library-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search banks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="banks-grid">
          {filteredBanks.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} />
              <h2>No question banks</h2>
              <p>Create your first question bank to store reusable questions</p>
            </div>
          ) : (
            filteredBanks.map((bank) => (
              <div key={bank.id} className="bank-card">
                <div className="bank-header">
                  <div className="bank-icon">
                    <BookOpen size={24} />
                  </div>
                  <div className="bank-title">
                    <h3>{bank.title}</h3>
                    <span className="subject-badge">{bank.subject}</span>
                  </div>
                  <div className="bank-actions">
                    <button className="icon-button" title="Copy">
                      <Copy size={16} />
                    </button>
                    <button
                      className="icon-button danger"
                      title="Delete"
                      onClick={() => handleDeleteBank(bank.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bank-stats">
                  <span className="stat">
                    <strong>{bank.questionCount}</strong> questions
                  </span>
                  <span className="stat">
                    Updated {new Date(bank.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="bank-tags">
                  {bank.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="bank-actions-footer">
                  <button className="secondary-pill light">
                    <Download size={14} />
                    Export
                  </button>
                  <button className="secondary-pill light">
                    Use in Assessment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .library-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .library-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .library-header h1 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }

        .library-header p {
          color: var(--muted);
          font-size: 14px;
          margin: 0;
        }

        .bank-form {
          background: var(--panel-2);
          border-radius: var(--radius-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow-sm);
        }

        .form-row {
          display: flex;
          gap: 16px;
        }

        .form-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-field.full {
          flex: 1 0 100%;
        }

        .form-field label {
          font-weight: 600;
          font-size: 14px;
          color: var(--ink);
        }

        .form-field input,
        .form-field select {
          padding: 10px 14px;
          border: 1px solid var(--panel-3);
          border-radius: var(--radius-md);
          font-size: 14px;
          font-family: inherit;
        }

        .form-field input:focus,
        .form-field select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(255, 106, 61, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .library-controls {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .search-box {
          flex: 1;
          position: relative;
        }

        .search-box input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid var(--panel-3);
          border-radius: var(--radius-md);
          font-size: 14px;
          background: var(--panel-2);
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: var(--panel-2);
          border: 1px solid var(--panel-3);
          border-radius: var(--radius-md);
          color: var(--muted);
        }

        .filter-group select {
          border: none;
          background: transparent;
          font-size: 14px;
          cursor: pointer;
          color: var(--ink);
        }

        .filter-group select:focus {
          outline: none;
        }

        .banks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 16px;
        }

        .bank-card {
          background: var(--panel-2);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: box-shadow 0.2s;
        }

        .bank-card:hover {
          box-shadow: var(--shadow-md);
        }

        .bank-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .bank-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255, 106, 61, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          flex-shrink: 0;
        }

        .bank-title {
          flex: 1;
        }

        .bank-title h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .subject-badge {
          display: inline-block;
          padding: 2px 8px;
          background: var(--accent-2);
          color: var(--accent);
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .bank-actions {
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

        .bank-stats {
          display: flex;
          gap: 16px;
          font-size: 13px;
          color: var(--muted);
        }

        .bank-stats .stat {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .bank-stats strong {
          color: var(--ink);
          font-weight: 600;
        }

        .bank-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--panel-3);
        }

        .tag {
          display: inline-block;
          padding: 4px 10px;
          background: var(--panel-3);
          color: var(--muted);
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .bank-actions-footer {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--panel-3);
        }

        .bank-actions-footer button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
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
          .library-header {
            flex-direction: column;
          }

          .banks-grid {
            grid-template-columns: 1fr;
          }

          .form-row {
            flex-direction: column;
          }

          .library-controls {
            flex-direction: column;
          }

          .search-box {
            width: 100%;
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
