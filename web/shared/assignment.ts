import { z } from 'zod';
import { demoProfile } from './profile.js';

export const questionDifficultyValues = ['easy', 'medium', 'hard'] as const;
export type QuestionDifficulty = (typeof questionDifficultyValues)[number];

export const assignmentStatusValues = [
  'draft',
  'queued',
  'generating',
  'completed',
  'failed'
] as const;
export type AssignmentStatus = (typeof assignmentStatusValues)[number];

export const questionTypeCatalog = [
  {
    id: 'mcq',
    label: 'Multiple Choice Questions',
    shortLabel: 'MCQ',
    defaultCount: 4,
    defaultMarks: 1
  },
  {
    id: 'short',
    label: 'Short Questions',
    shortLabel: 'Short',
    defaultCount: 3,
    defaultMarks: 2
  },
  {
    id: 'diagram',
    label: 'Diagram/Graph-Based Questions',
    shortLabel: 'Diagram',
    defaultCount: 5,
    defaultMarks: 5
  },
  {
    id: 'numerical',
    label: 'Numerical Problems',
    shortLabel: 'Numerical',
    defaultCount: 5,
    defaultMarks: 5
  }
] as const;

export type QuestionTypeCatalogItem = (typeof questionTypeCatalog)[number];

export const questionTypeInputSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  count: z.coerce.number().int().min(1, 'Questions must be at least 1'),
  marks: z.coerce.number().int().min(1, 'Marks must be at least 1')
});

export const createAssignmentRequestSchema = z.object({
  title: z.string().trim().min(1).optional(),
  dueDate: z.string().trim().min(1, 'Due date is required'),
  instructions: z.string().trim().min(1, 'Additional instructions are required'),
  subject: z.string().trim().optional(),
  className: z.string().trim().optional(),
  sourceFileName: z.string().trim().optional(),
  sourceFileType: z.string().trim().optional(),
  sourceFileText: z.string().trim().optional(),
  questionTypes: z.array(questionTypeInputSchema).min(1, 'Add at least one question type')
});

export type CreateAssignmentRequest = z.infer<typeof createAssignmentRequestSchema>;

export const paperQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  difficulty: z.enum(questionDifficultyValues),
  marks: z.number().int().min(1),
  answer: z.string().min(1)
});

export const paperSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  instruction: z.string(),
  questions: z.array(paperQuestionSchema)
});

export const questionPaperSchema = z.object({
  title: z.string(),
  schoolName: z.string(),
  subject: z.string(),
  className: z.string(),
  introMessage: z.string(),
  timeAllowed: z.string(),
  maximumMarks: z.number().int(),
  instructions: z.array(z.string()),
  studentInfoFields: z.array(z.string()),
  sections: z.array(paperSectionSchema),
  answerKey: z.array(z.string()),
  generatedAt: z.string()
});

export type QuestionPaper = z.infer<typeof questionPaperSchema>;
export type PaperSection = z.infer<typeof paperSectionSchema>;
export type PaperQuestion = z.infer<typeof paperQuestionSchema>;

export const assignmentRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string(),
  instructions: z.string(),
  subject: z.string(),
  className: z.string(),
  request: z.object({
    title: z.string().trim().optional(),
    dueDate: z.string().trim(),
    instructions: z.string().trim(),
    subject: z.string().trim().optional(),
    className: z.string().trim().optional(),
    sourceFileName: z.string().trim().optional(),
    sourceFileType: z.string().trim().optional(),
    sourceFileText: z.string().trim().optional(),
    questionTypes: z.array(questionTypeInputSchema)
  }),
  sourceFileName: z.string().optional(),
  sourceFileType: z.string().optional(),
  sourceFileText: z.string().optional(),
  questionTypes: z.array(questionTypeInputSchema),
  status: z.enum(assignmentStatusValues),
  progress: z.number().min(0).max(100),
  progressLabel: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  generatedAt: z.string().optional(),
  generatedPaper: questionPaperSchema.optional(),
  pdfPath: z.string().optional(),
  pdfReady: z.boolean().default(false)
});

export type AssignmentRecord = z.infer<typeof assignmentRecordSchema>;

export type AssignmentQueuePayload = {
  assignmentId: string;
  request: CreateAssignmentRequest;
};
