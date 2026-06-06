import {
  CreateAssignmentRequest,
  PaperQuestion,
  PaperSection,
  QuestionDifficulty,
  QuestionPaper,
  questionTypeCatalog
} from './assignment.js';
import { demoProfile } from './profile.js';

type TopicProfile = {
  subject: string;
  className: string;
  title: string;
  introMessage: string;
  timeAllowed: string;
  focus: string[];
  answerTone: string;
};

const topicProfiles: Array<{
  keywords: RegExp[];
  profile: TopicProfile;
}> = [
  {
    keywords: [/electricity/i, /current/i, /circuit/i, /conductor/i, /insulator/i, /voltage/i, /ncert/i],
    profile: {
      subject: 'Science',
      className: '5th',
      title: 'Quiz on Electricity',
      introMessage:
        'Here are a customized question paper for your CBSE Grade 5 Science class on the NCERT chapters.',
      timeAllowed: '45 minutes',
      focus: ['electric circuits', 'conductors', 'insulators', 'electrical safety', 'current'],
      answerTone: 'Use science terms like conductor, circuit, and source of current.'
    }
  },
  {
    keywords: [/grammar/i, /english/i, /comprehension/i, /noun/i, /verb/i, /adjective/i, /reading/i],
    profile: {
      subject: 'English',
      className: '5th',
      title: 'English Practice Set',
      introMessage: 'Here is a structured English assessment with comprehension and language practice.',
      timeAllowed: '45 minutes',
      focus: ['grammar', 'sentence structure', 'vocabulary', 'reading skills', 'writing'],
      answerTone: 'Use clear sentence-based answers with examples.'
    }
  },
  {
    keywords: [/math/i, /algebra/i, /fraction/i, /geometry/i, /number/i, /equation/i, /measurement/i],
    profile: {
      subject: 'Mathematics',
      className: '5th',
      title: 'Mathematics Assessment',
      introMessage: 'Here is a balanced Mathematics paper with reasoning and calculation practice.',
      timeAllowed: '45 minutes',
      focus: ['numbers', 'patterns', 'measurement', 'reasoning', 'operations'],
      answerTone: 'Show each step clearly and include the final answer.'
    }
  }
];

const defaultProfile: TopicProfile = {
  subject: demoProfile.subject,
  className: demoProfile.className,
  title: 'AI Assessment',
  introMessage: 'Here is a structured assessment paper generated from your assignment brief.',
  timeAllowed: '45 minutes',
  focus: ['concepts', 'reasoning', 'application', 'analysis', 'recall'],
  answerTone: 'Keep answers short, clear, and curriculum friendly.'
};

const sectionInstructions: Record<string, string> = {
  mcq: 'Attempt all questions. Choose the most appropriate answer.',
  short: 'Attempt all questions. Each answer should be concise and to the point.',
  diagram: 'Attempt all questions. Draw neat, labelled diagrams wherever required.',
  numerical: 'Show all working steps clearly before writing the final answer.'
};

const sectionNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const pad = (value: number) => String(value).padStart(2, '0');

function pickTopicProfile(text: string): TopicProfile {
  const normalizedText = text.trim();
  for (const entry of topicProfiles) {
    if (entry.keywords.some((keyword) => keyword.test(normalizedText))) {
      return entry.profile;
    }
  }
  return defaultProfile;
}

function deriveFocusWords(input: CreateAssignmentRequest, profile: TopicProfile): string[] {
  const combined = [input.title, input.instructions, input.sourceFileText, input.sourceFileName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const customWords = profile.focus.filter((word) => combined.includes(word.split(' ')[0]));
  return customWords.length > 0 ? customWords : profile.focus;
}

function deriveTitle(input: CreateAssignmentRequest, profile: TopicProfile): string {
  const combined = [input.title, input.instructions, input.sourceFileText, input.sourceFileName]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (input.title) {
    return input.title;
  }

  if (combined.includes('quiz')) {
    return `Quiz on ${profile.subject === 'Science' ? 'Electricity' : profile.subject}`;
  }

  if (combined.includes('assessment')) {
    return `${profile.subject} Assessment`;
  }

  return profile.title;
}

function inferSubjectAndClass(input: CreateAssignmentRequest): TopicProfile {
  const combinedText = [input.title, input.instructions, input.sourceFileText, input.sourceFileName]
    .filter(Boolean)
    .join(' ');
  const profile = pickTopicProfile(combinedText);
  return {
    subject: input.subject || profile.subject,
    className: input.className || profile.className,
    title: deriveTitle(input, profile),
    introMessage: profile.introMessage,
    timeAllowed: profile.timeAllowed,
    focus: deriveFocusWords(input, profile),
    answerTone: profile.answerTone
  };
}

export function buildAssessmentPreview(input: CreateAssignmentRequest) {
  const profile = inferSubjectAndClass(input);
  const maximumMarks = maxMarksFromInput(input);
  return {
    title: profile.title,
    subject: profile.subject,
    className: profile.className,
    introMessage: `Certainly, ${demoProfile.assistantName}! Here are customized Question Paper for your ${profile.className} ${profile.subject} classes on the NCERT chapters:`,
    timeAllowed: deriveTimeAllowed(maximumMarks),
    maximumMarks
  };
}

function selectDifficulty(sectionIndex: number, questionIndex: number, marks: number): QuestionDifficulty {
  if (marks >= 5 || questionIndex >= 3) {
    return sectionIndex % 2 === 0 ? 'hard' : 'medium';
  }
  if (questionIndex === 0) {
    return 'easy';
  }
  if (questionIndex === 1) {
    return 'medium';
  }
  return 'hard';
}

function difficultyLabel(difficulty: QuestionDifficulty): string {
  if (difficulty === 'easy') return 'Easy';
  if (difficulty === 'medium') return 'Moderate';
  return 'Hard';
}

function buildGenericQuestion(
  typeLabel: string,
  focus: string[],
  sectionName: string,
  questionNumber: number,
  difficulty: QuestionDifficulty,
  profile: TopicProfile
): { text: string; answer: string } {
  const coreFocus = focus[questionNumber % focus.length];
  const lead = `Section ${sectionName} Q${questionNumber + 1}`;

  if (/mcq|multiple choice/i.test(typeLabel)) {
    return {
      text: `${lead}. Which statement best describes ${coreFocus} in the context of ${profile.subject.toLowerCase()}?`,
      answer: `${coreFocus} should be identified by its role in the learning outcome and the correct option will reflect the concept accurately.`
    };
  }

  if (/short/i.test(typeLabel)) {
    return {
      text: `${lead}. Explain ${coreFocus} in one or two clear sentences.`,
      answer: `A concise explanation of ${coreFocus} that includes the main idea and a supporting detail.`
    };
  }

  if (/diagram|graph/i.test(typeLabel)) {
    return {
      text: `${lead}. Draw or interpret a neat labelled diagram that shows ${coreFocus}.`,
      answer: `The answer should include a labelled diagram or a clear interpretation of ${coreFocus}.`
    };
  }

  if (/numerical|problem/i.test(typeLabel)) {
    return {
      text: `${lead}. Solve a situation-based problem on ${coreFocus} and show every step.`,
      answer: `Use the given values, show working steps, and present the final result clearly.`
    };
  }

  return {
    text: `${lead}. Write a response that explains ${coreFocus} with one relevant example.`,
    answer: `The response should define ${coreFocus}, mention its use, and include one example.`
  };
}

function buildSectionInstruction(typeLabel: string): string {
  const normalized = typeLabel.toLowerCase();
  if (normalized.includes('mcq')) return sectionInstructions.mcq;
  if (normalized.includes('short')) return sectionInstructions.short;
  if (normalized.includes('diagram') || normalized.includes('graph')) return sectionInstructions.diagram;
  if (normalized.includes('numerical') || normalized.includes('problem')) return sectionInstructions.numerical;
  return 'Attempt all questions in this section.';
}

function buildSectionTitle(typeLabel: string, sectionIndex: number): string {
  const letter = sectionNames[sectionIndex] ?? String.fromCharCode(65 + sectionIndex);
  const normalized = typeLabel.toLowerCase();
  const suffix =
    normalized.includes('mcq')
      ? 'Multiple Choice Questions'
      : normalized.includes('short')
        ? 'Short Answer Questions'
        : normalized.includes('diagram') || normalized.includes('graph')
          ? 'Diagram/Graph-Based Questions'
          : normalized.includes('numerical') || normalized.includes('problem')
            ? 'Numerical Problems'
            : typeLabel;
  return `Section ${letter}`;
}

function buildSectionSubtitle(typeLabel: string): string {
  const normalized = typeLabel.toLowerCase();
  if (normalized.includes('mcq')) return 'Multiple Choice Questions';
  if (normalized.includes('short')) return 'Short Answer Questions';
  if (normalized.includes('diagram') || normalized.includes('graph')) return 'Diagram/Graph-Based Questions';
  if (normalized.includes('numerical') || normalized.includes('problem')) return 'Numerical Problems';
  return typeLabel;
}

function buildSectionQuestions(
  input: CreateAssignmentRequest,
  profile: TopicProfile,
  sectionIndex: number,
  typeLabel: string,
  count: number,
  marks: number
): { section: PaperSection; answers: string[] } {
  const sectionName = sectionNames[sectionIndex] ?? String.fromCharCode(65 + sectionIndex);
  const focus = profile.focus;
  const questions: PaperQuestion[] = [];
  const answers: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const difficulty = selectDifficulty(sectionIndex, index, marks);
    const { text, answer } = buildGenericQuestion(typeLabel, focus, sectionName, index, difficulty, profile);
    questions.push({
      id: `${sectionName.toLowerCase()}-${index + 1}`,
      text,
      difficulty,
      marks,
      answer
    });
    answers.push(answer);
  }

  return {
    section: {
      id: sectionName.toLowerCase(),
      title: buildSectionTitle(typeLabel, sectionIndex),
      subtitle: buildSectionSubtitle(typeLabel),
      instruction: buildSectionInstruction(typeLabel),
      questions
    },
    answers
  };
}

function maxMarksFromInput(input: CreateAssignmentRequest): number {
  return input.questionTypes.reduce((total, entry) => total + entry.count * entry.marks, 0);
}

function formatDueDate(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

function deriveTimeAllowed(maximumMarks: number): string {
  if (maximumMarks <= 20) return '45 minutes';
  if (maximumMarks <= 40) return '60 minutes';
  if (maximumMarks <= 60) return '90 minutes';
  return '2 hours';
}

export function buildStructuredAssessment(input: CreateAssignmentRequest): QuestionPaper {
  const profile = inferSubjectAndClass(input);
  const sections: PaperSection[] = [];
  const answerKey: string[] = [];
  let runningIndex = 0;

  for (const questionType of input.questionTypes) {
    const built = buildSectionQuestions(
      input,
      profile,
      runningIndex,
      questionType.label,
      questionType.count,
      questionType.marks
    );
    sections.push(built.section);
    answerKey.push(...built.answers);
    runningIndex += 1;
  }

  const maximumMarks = maxMarksFromInput(input);
  const preview = buildAssessmentPreview(input);

  return {
    title: preview.title,
    schoolName: demoProfile.schoolName,
    subject: preview.subject,
    className: preview.className,
    introMessage: preview.introMessage,
    timeAllowed: preview.timeAllowed,
    maximumMarks,
    instructions: [
      'All questions are compulsory unless stated otherwise.',
      `Attempt the paper within ${deriveTimeAllowed(maximumMarks)}.`,
      `Use the appropriate level of detail for ${profile.subject.toLowerCase()} responses.`
    ],
    studentInfoFields: ['Name', 'Roll Number', 'Class', 'Section'],
    sections,
    answerKey,
    generatedAt: new Date().toISOString()
  };
}

export function buildPrompt(input: CreateAssignmentRequest): string {
  const profile = inferSubjectAndClass(input);
  const dueDate = formatDueDate(input.dueDate);
  const questionBlueprint = input.questionTypes
    .map(
      (entry, index) =>
        `${index + 1}. ${entry.label} | Questions: ${entry.count} | Marks each: ${entry.marks}`
    )
    .join('\n');

  return [
    'You are an expert exam paper designer for school assessments.',
    'Return a strict JSON object that matches the assessment schema.',
    `School: ${demoProfile.schoolName}`,
    `Subject: ${profile.subject}`,
    `Class: ${profile.className}`,
    `Assessment title: ${profile.title}`,
    `Due date: ${dueDate}`,
    `Instructions: ${input.instructions}`,
    `Question blueprint:\n${questionBlueprint}`,
    `Reference file name: ${input.sourceFileName ?? 'none'}`,
    `Reference file content:\n${input.sourceFileText ?? 'none'}`,
    'Every question must have difficulty, marks, and an answer key entry.',
    `Tone guidance: ${profile.answerTone}`
  ].join('\n');
}

export function difficultyToBadgeText(difficulty: QuestionDifficulty): string {
  if (difficulty === 'easy') return 'Easy';
  if (difficulty === 'medium') return 'Moderate';
  return 'Hard';
}

export function buildSectionHeaderLabel(sectionIndex: number, section: PaperSection): string {
  const sectionName = sectionNames[sectionIndex] ?? String.fromCharCode(65 + sectionIndex);
  return `${sectionName}`;
}

export function buildSummaryLine(input: CreateAssignmentRequest): string {
  const profile = inferSubjectAndClass(input);
  return `Customized ${profile.subject} paper for ${profile.className} learners, generated from your brief and uploaded material.`;
}
