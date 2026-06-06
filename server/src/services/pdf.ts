import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { once } from 'node:events';
import PDFDocument from 'pdfkit';
import type { QuestionPaper, QuestionDifficulty } from 'web/shared/assignment';

type PdfDocument = InstanceType<typeof PDFDocument>;

const difficultyLabels: Record<QuestionDifficulty, string> = {
  easy: 'Easy',
  medium: 'Moderate',
  hard: 'Hard'
};

function wrapHeading(doc: PdfDocument, text: string, width: number): number {
  const height = doc.heightOfString(text, { width, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(16).fillColor('#232323').text(text, { width, align: 'center' });
  return height;
}

function drawStudentLine(doc: PdfDocument, label: string, x: number, y: number, width: number) {
  doc.font('Helvetica').fontSize(10).fillColor('#111111').text(`${label}:`, x, y);
  doc.moveTo(x + 45, y + 11).lineTo(x + width, y + 11).strokeColor('#555555').lineWidth(0.8).stroke();
}

function ensureSpace(doc: PdfDocument, requiredHeight: number) {
  const bottomLimit = doc.page.height - doc.page.margins.bottom - 24;
  if (doc.y + requiredHeight > bottomLimit) {
    doc.addPage();
    doc.y = doc.page.margins.top;
  }
}

function drawQuestion(doc: PdfDocument, index: number, sectionName: string, questionText: string, difficulty: QuestionDifficulty, marks: number, width: number) {
  const label = `[${difficultyLabels[difficulty]}]`;
  const fullText = `${index}. ${label} ${questionText} [${marks} Marks]`;
  const height = doc.heightOfString(fullText, { width, lineGap: 2 });
  ensureSpace(doc, height + 18);
  doc.font('Helvetica').fontSize(10).fillColor('#222222').text(fullText, { width, lineGap: 2 });
  doc.moveDown(0.45);
}

export async function renderQuestionPaperPdf(paper: QuestionPaper, outputPath: string): Promise<string> {
  await mkdir(path.dirname(outputPath), { recursive: true });

  const doc = new PDFDocument({
    size: 'A4',
    margin: 42,
    bufferPages: true
  });

  const stream = createWriteStream(outputPath);
  doc.pipe(stream);

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Top summary strip
  doc.roundedRect(doc.x, doc.y, contentWidth, 72, 16).fillAndStroke('#262626', '#262626');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(paper.introMessage, doc.x + 18, doc.y + 14, {
    width: contentWidth - 36
  });
  doc.fillColor('#ffffff').font('Helvetica').fontSize(9).text('Generated question paper', doc.x + 18, doc.y + 43);
  doc.rect(doc.x + 18, doc.y + 48, 116, 24).fill('#ffffff');
  doc.fillColor('#111111').font('Helvetica-Bold').fontSize(9).text('Download as PDF', doc.x + 34, doc.y + 56);

  doc.moveDown(5.3);

  doc.moveDown(0.6);
  wrapHeading(doc, paper.schoolName, contentWidth);
  doc.moveDown(0.1);
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#222222').text(`Subject: ${paper.subject}`, {
    width: contentWidth,
    align: 'center'
  });
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222').text(`Class: ${paper.className}`, {
    width: contentWidth,
    align: 'center'
  });

  doc.moveDown(1.2);
  doc.font('Helvetica').fontSize(10).fillColor('#111111').text(`Time Allowed: ${paper.timeAllowed}`, doc.x, doc.y, {
    width: contentWidth / 2
  });
  doc.font('Helvetica').fontSize(10).fillColor('#111111').text(`Maximum Marks: ${paper.maximumMarks}`, {
    width: contentWidth,
    align: 'right'
  });
  doc.moveDown(1.2);

  paper.instructions.forEach((instruction) => {
    doc.font('Helvetica').fontSize(10).fillColor('#222222').text(instruction, {
      width: contentWidth
    });
    doc.moveDown(0.35);
  });

  doc.moveDown(0.7);
  drawStudentLine(doc, 'Name', doc.x, doc.y, doc.page.width - doc.page.margins.right - doc.x);
  doc.moveDown(0.6);
  drawStudentLine(doc, 'Roll Number', doc.x, doc.y, doc.page.width - doc.page.margins.right - doc.x);
  doc.moveDown(0.6);
  drawStudentLine(doc, 'Class', doc.x, doc.y, doc.page.width - doc.page.margins.right - doc.x);
  doc.moveDown(0.6);
  drawStudentLine(doc, 'Section', doc.x, doc.y, doc.page.width - doc.page.margins.right - doc.x);

  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#222222').text('Question Paper', {
    width: contentWidth,
    align: 'center'
  });
  doc.moveDown(0.8);

  let questionCounter = 1;
  paper.sections.forEach((section, sectionIndex) => {
    ensureSpace(doc, 80);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#1d1d1d').text(section.title, {
      width: contentWidth,
      align: 'center'
    });
    doc.moveDown(0.35);
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#222222').text(section.subtitle ?? section.instruction, {
      width: contentWidth
    });
    doc.font('Helvetica').fontSize(8.7).fillColor('#555555').text(section.instruction, {
      width: contentWidth
    });
    doc.moveDown(0.4);

    section.questions.forEach((question) => {
      drawQuestion(
        doc,
        questionCounter,
        section.title,
        question.text,
        question.difficulty,
        question.marks,
        contentWidth
      );
      questionCounter += 1;
    });

    if (sectionIndex < paper.sections.length - 1) {
      doc.moveDown(0.5);
      doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeColor('#d7d7d7').lineWidth(0.6).stroke();
      doc.moveDown(0.7);
    }
  });

  ensureSpace(doc, 50);
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#222222').text('End of Question Paper', {
    width: contentWidth,
    align: 'left'
  });

  doc.addPage();
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#222222').text('Answer Key', {
    width: contentWidth
  });
  doc.moveDown(0.6);
  paper.answerKey.forEach((answer, index) => {
    const answerText = `${index + 1}. ${answer}`;
    ensureSpace(doc, doc.heightOfString(answerText, { width: contentWidth }) + 16);
    doc.font('Helvetica').fontSize(9.5).fillColor('#333333').text(answerText, {
      width: contentWidth,
      lineGap: 2
    });
    doc.moveDown(0.3);
  });

  doc.end();
  await once(stream, 'finish');

  const result = await stat(outputPath);
  if (!result.isFile()) {
    throw new Error('Failed to generate PDF output.');
  }

  return outputPath;
}
