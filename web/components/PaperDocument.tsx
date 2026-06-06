'use client';

import type { QuestionPaper, QuestionDifficulty } from '@shared/assignment';

const difficultyClass: Record<QuestionDifficulty, string> = {
  easy: 'is-easy',
  medium: 'is-medium',
  hard: 'is-hard'
};

function QuestionBadge({ difficulty }: { difficulty: QuestionDifficulty }) {
  const label = difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Moderate' : 'Hard';
  return <span className={`difficulty-badge ${difficultyClass[difficulty] ?? ''}`}>{label}</span>;
}

export function PaperDocument({ paper }: { paper: QuestionPaper }) {
  return (
    <div className="paper-stage">
      <article className="paper-sheet">
        <header className="paper-heading">
          <h1>{paper.schoolName}</h1>
          <h2>Subject: {paper.subject}</h2>
          <h3>Class: {paper.className}</h3>
        </header>

        <div className="paper-meta-row">
          <span>
            <strong>Time Allowed:</strong> {paper.timeAllowed}
          </span>
          <span>
            <strong>Maximum Marks:</strong> {paper.maximumMarks}
          </span>
        </div>

        <p className="paper-instruction">{paper.instructions[0]}</p>

        <section className="student-info">
          {paper.studentInfoFields.map((field) => (
            <div key={field} className="student-line">
              <span>{field}:</span>
              <i />
            </div>
          ))}
        </section>

        {paper.sections.map((section, index) => (
          <section key={section.id} className="question-section">
            <h4>{section.title}</h4>
            <strong>{section.subtitle}</strong>
            <p>{section.instruction}</p>

            <ol>
              {section.questions.map((question) => (
                <li key={question.id} className="question-item">
                  <div className="question-line">
                    <QuestionBadge difficulty={question.difficulty} />
                    <span>{question.text}</span>
                  </div>
                  <em>[{question.marks} Marks]</em>
                </li>
              ))}
            </ol>

            {index === paper.sections.length - 1 ? null : <div className="section-divider" />}
          </section>
        ))}

        <p className="paper-end">End of Question Paper</p>

        <section className="answer-key">
          <h4>Answer Key:</h4>
          <ol>
            {paper.answerKey.map((answer, index) => (
              <li key={`${index}-${answer}`}>{answer}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
