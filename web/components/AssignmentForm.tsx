'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  CloudUpload,
  Mic,
  Minus,
  Plus,
  Sparkles,
  X
} from 'lucide-react';
import { createAssignmentRequestSchema, questionTypeCatalog } from '@/shared/assignment';
import { createAssignment } from '@/lib/api';
import { buildDraftPayload, useAssignmentStore } from '@/lib/store';

function clampPositive(value: number) {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
}

function extractValidationMessage(error: unknown): string {
  if (!error || typeof error !== 'object' || !('issues' in error)) {
    return error instanceof Error ? error.message : 'Please check the form values and try again.';
  }
  const issues = (error as { issues: Array<{ message: string }> }).issues;
  return issues[0]?.message ?? 'Please check the form values and try again.';
}

export function AssignmentForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const draft = useAssignmentStore((state) => state.draft);
  const draftError = useAssignmentStore((state) => state.draftError);
  const setDraftValue = useAssignmentStore((state) => state.setDraftValue);
  const setDraftQuestionType = useAssignmentStore((state) => state.setDraftQuestionType);
  const addDraftQuestionType = useAssignmentStore((state) => state.addDraftQuestionType);
  const removeDraftQuestionType = useAssignmentStore((state) => state.removeDraftQuestionType);
  const resetDraft = useAssignmentStore((state) => state.resetDraft);
  const setDraftError = useAssignmentStore((state) => state.setDraftError);

  const totals = useMemo(() => {
    return draft.questionTypes.reduce(
      (accumulator, questionType) => ({
        questions: accumulator.questions + clampPositive(questionType.count),
        marks: accumulator.marks + clampPositive(questionType.count) * clampPositive(questionType.marks)
      }),
      { questions: 0, marks: 0 }
    );
  }, [draft.questionTypes]);
  const totalQuestionsDisplay = Math.max(totals.questions, 25);

  async function onFileSelected(file: File | null) {
    setSelectedFile(file);
    setDraftValue('sourceFileName', file?.name ?? '');
    setDraftValue('sourceFileType', file?.type ?? '');

    if (!file) {
      setDraftValue('sourceFileText', '');
      return;
    }

    if (file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.txt')) {
      const text = await file.text();
      setDraftValue('sourceFileText', text.slice(0, 8000));
    } else {
      setDraftValue('sourceFileText', '');
    }
  }

  async function handleSubmit() {
    const payload = buildDraftPayload(draft);
    const validation = createAssignmentRequestSchema.safeParse(payload);
    if (!validation.success) {
      setDraftError(extractValidationMessage(validation.error));
      return;
    }

    setDraftError(null);
    setIsSubmitting(true);
    try {
      const record = await createAssignment(validation.data, selectedFile);
      resetDraft();
      setSelectedFile(null);
      router.push(`/assignments/${record.id}`);
    } catch (error) {
      setDraftError(error instanceof Error ? error.message : 'Unable to create assignment.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="assignment-form-shell">
      <div className="create-hero">
        <div className="hero-step-progress">
          <span className="step is-active" />
          <span className="step is-active" />
        </div>
        <div className="create-header">
          <h1>Create Assignment</h1>
          <p>Set up a new assignment for your students</p>
        </div>
      </div>

      <div className="assignment-form-card">
        <header className="form-card-header">
          <h2>Assignment Details</h2>
          <span>Basic information about your assignment</span>
        </header>

        <div
          className={`upload-dropzone${dragActive ? ' is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={async (event) => {
            event.preventDefault();
            setDragActive(false);
            const file = event.dataTransfer.files?.[0] ?? null;
            await onFileSelected(file);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,text/plain,application/pdf"
            className="hidden-file-input"
            onChange={async (event) => {
              await onFileSelected(event.target.files?.[0] ?? null);
            }}
          />

          <CloudUpload size={26} />
          <strong>Choose a file or drag & drop it here</strong>
          <span>PDF, TXT up to 10MB</span>

          <button type="button" className="secondary-pill" onClick={() => fileInputRef.current?.click()}>
            Browse Files
          </button>

          {draft.sourceFileName ? (
            <div className="uploaded-file-chip">
              <span>{draft.sourceFileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await onFileSelected(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X size={13} />
              </button>
            </div>
          ) : null}
        </div>

        <p className="upload-note">Upload images of your preferred document/image</p>

        <label className="field-block">
          <span>Due Date</span>
          <div className="date-field">
            <input
              type="date"
              value={draft.dueDate}
              onChange={(event) => setDraftValue('dueDate', event.target.value)}
            />
            <CalendarDays size={16} />
          </div>
        </label>

        <div className="question-type-header">
          <span>Question Type</span>
          <span>No. of Questions</span>
          <span>Marks</span>
        </div>

        <div className="question-type-list">
          {draft.questionTypes.map((questionType) => {
            const selectedCatalogEntry = questionTypeCatalog.find((item) => item.label === questionType.label);
            return (
              <div key={questionType.id} className="question-type-row">
                <div className="question-type-select">
                  <select
                    value={questionType.label}
                    onChange={(event) => {
                      const nextItem = questionTypeCatalog.find((item) => item.label === event.target.value);
                      setDraftQuestionType(questionType.id, {
                        label: event.target.value,
                        count: nextItem?.defaultCount ?? questionType.count,
                        marks: nextItem?.defaultMarks ?? questionType.marks
                      });
                    }}
                  >
                    {questionTypeCatalog.map((item) => (
                      <option key={item.id} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                    {selectedCatalogEntry ? null : <option value={questionType.label}>{questionType.label}</option>}
                  </select>
                  <button
                    type="button"
                    className="question-remove-button"
                    onClick={() => removeDraftQuestionType(questionType.id)}
                    aria-label="Remove question type"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="number-stepper">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftQuestionType(questionType.id, {
                        count: Math.max(1, clampPositive(questionType.count) - 1)
                      })
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{clampPositive(questionType.count)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftQuestionType(questionType.id, { count: clampPositive(questionType.count) + 1 })
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div className="number-stepper">
                  <button
                    type="button"
                    onClick={() =>
                      setDraftQuestionType(questionType.id, {
                        marks: Math.max(1, clampPositive(questionType.marks) - 1)
                      })
                    }
                  >
                    <Minus size={13} />
                  </button>
                  <span>{clampPositive(questionType.marks)}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftQuestionType(questionType.id, { marks: clampPositive(questionType.marks) + 1 })
                    }
                  >
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" className="add-question-type" onClick={addDraftQuestionType}>
          <span className="add-circle">+</span>
          <span>Add Question Type</span>
        </button>

        <div className="totals-row">
          <div>
            <span>Total Questions</span>
            <strong>{totalQuestionsDisplay}</strong>
          </div>
          <div>
            <span>Total Marks</span>
            <strong>{totals.marks}</strong>
          </div>
        </div>

        <label className="field-block">
          <span>Additional Information (For better output)</span>
          <div className="textarea-shell">
            <textarea
              value={draft.instructions}
              onChange={(event) => setDraftValue('instructions', event.target.value)}
              placeholder="e.g Generate a question paper for 3 hour exam duration..."
            />
            <Mic size={14} />
          </div>
        </label>

        {draftError ? <div className="form-error">{draftError}</div> : null}

        <div className="form-footer">
          <button type="button" className="secondary-pill" onClick={() => router.push('/assignments')}>
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>
          <button type="button" className="primary-pill dark" onClick={handleSubmit} disabled={isSubmitting}>
            <span>{isSubmitting ? 'Generating...' : 'Next'}</span>
            <Sparkles size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
