import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AssignmentRecord, CreateAssignmentRequest } from '@/shared/assignment';
import { questionTypeCatalog } from '@/shared/assignment';

export type DraftQuestionType = {
  id: string;
  label: string;
  count: number;
  marks: number;
};

export type AssignmentDraft = Pick<
  CreateAssignmentRequest,
  'dueDate' | 'instructions' | 'subject' | 'className' | 'sourceFileName' | 'sourceFileType' | 'sourceFileText'
> & {
  questionTypes: DraftQuestionType[];
};

type SocketStatus = 'disconnected' | 'connecting' | 'connected';

type AssignmentStore = {
  assignments: AssignmentRecord[];
  activeAssignmentId: string | null;
  socketStatus: SocketStatus;
  draft: AssignmentDraft;
  draftError: string | null;
  activeFilter: 'all' | 'queued' | 'generating' | 'completed' | 'failed';
  searchQuery: string;
  setAssignments: (records: AssignmentRecord[]) => void;
  upsertAssignment: (record: AssignmentRecord) => void;
  removeAssignment: (id: string) => void;
  setActiveAssignmentId: (id: string | null) => void;
  setSocketStatus: (status: SocketStatus) => void;
  setDraftValue: <K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) => void;
  setDraftQuestionType: (id: string, patch: Partial<DraftQuestionType>) => void;
  addDraftQuestionType: () => void;
  removeDraftQuestionType: (id: string) => void;
  resetDraft: () => void;
  setDraftError: (message: string | null) => void;
  setActiveFilter: (value: AssignmentStore['activeFilter']) => void;
  setSearchQuery: (value: string) => void;
};

function createInitialQuestionTypes(): DraftQuestionType[] {
  return questionTypeCatalog.map((item) => ({
    id: item.id,
    label: item.label,
    count: item.defaultCount,
    marks: item.defaultMarks
  }));
}

function createInitialDraft(): AssignmentDraft {
  return {
    dueDate: '',
    instructions: '',
    subject: '',
    className: '',
    sourceFileName: '',
    sourceFileType: '',
    sourceFileText: '',
    questionTypes: createInitialQuestionTypes()
  };
}

function sortAssignments(records: AssignmentRecord[]): AssignmentRecord[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

const draftStorage =
  typeof window === 'undefined' ? undefined : createJSONStorage(() => window.localStorage);

export const useAssignmentStore = create<AssignmentStore>()(
  persist(
    (set) => ({
      assignments: [],
      activeAssignmentId: null,
      socketStatus: 'disconnected',
      draft: createInitialDraft(),
      draftError: null,
      activeFilter: 'all',
      searchQuery: '',
      setAssignments: (records) => set({ assignments: sortAssignments(records) }),
      upsertAssignment: (record) =>
        set((state) => {
          const filtered = state.assignments.filter((entry) => entry.id !== record.id);
          return { assignments: sortAssignments([record, ...filtered]) };
        }),
      removeAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((record) => record.id !== id),
          activeAssignmentId: state.activeAssignmentId === id ? null : state.activeAssignmentId
        })),
      setActiveAssignmentId: (id) => set({ activeAssignmentId: id }),
      setSocketStatus: (status) => set({ socketStatus: status }),
      setDraftValue: (key, value) =>
        set((state) => ({
          draft: {
            ...state.draft,
            [key]: value
          }
        })),
      setDraftQuestionType: (id, patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes: state.draft.questionTypes.map((item) =>
              item.id === id ? { ...item, ...patch } : item
            )
          }
        })),
      addDraftQuestionType: () =>
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes: [
              ...state.draft.questionTypes,
              {
                id: `custom-${Date.now()}`,
                label: 'Custom Questions',
                count: 1,
                marks: 1
              }
            ]
          }
        })),
      removeDraftQuestionType: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            questionTypes: state.draft.questionTypes.length > 1
              ? state.draft.questionTypes.filter((item) => item.id !== id)
              : state.draft.questionTypes
          }
        })),
      resetDraft: () =>
        set({
          draft: createInitialDraft(),
          draftError: null
        }),
      setDraftError: (message) => set({ draftError: message }),
      setActiveFilter: (value) => set({ activeFilter: value }),
      setSearchQuery: (value) => set({ searchQuery: value })
    }),
    {
      name: 'veda-ai-assessment-draft',
      storage: draftStorage,
      partialize: (state) => ({
        draft: state.draft,
        activeFilter: state.activeFilter,
        searchQuery: state.searchQuery
      })
    }
  )
);

export function buildDraftPayload(draft: AssignmentDraft): CreateAssignmentRequest {
  return {
    dueDate: draft.dueDate,
    instructions: draft.instructions.trim(),
    subject: draft.subject?.trim() || undefined,
    className: draft.className?.trim() || undefined,
    sourceFileName: draft.sourceFileName?.trim() || undefined,
    sourceFileType: draft.sourceFileType?.trim() || undefined,
    sourceFileText: draft.sourceFileText?.trim() || undefined,
    questionTypes: draft.questionTypes.map((item) => ({
      id: item.id,
      label: item.label.trim() || 'Custom Questions',
      count: Number(item.count),
      marks: Number(item.marks)
    }))
  };
}
