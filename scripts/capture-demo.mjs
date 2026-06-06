import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(rootDir, '.captures');
await mkdir(outputDir, { recursive: true });

const executablePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await chromium.launch({
  headless: true,
  executablePath,
  args: ['--disable-gpu', '--no-sandbox']
});

const baseUrl = 'http://localhost:3000';
const apiUrl = 'http://localhost:4000';

async function createAssignment(request) {
  const formData = new FormData();
  formData.append('payload', JSON.stringify(request));
  const response = await fetch(`${apiUrl}/api/assignments`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

async function waitForAssignmentReady(id) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(`${apiUrl}/api/assignments/${id}`);
    if (response.ok) {
      const assignment = await response.json();
      if (assignment.pdfReady && assignment.generatedPaper) {
        return assignment;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Assignment ${id} did not finish in time`);
}

const sampleRequest = {
  dueDate: '2026-06-21',
  instructions: 'Generate a question paper for the electricity chapter from the NCERT syllabus.',
  questionTypes: [
    { id: 'mcq', label: 'Multiple Choice Questions', count: 4, marks: 1 },
    { id: 'short', label: 'Short Questions', count: 3, marks: 2 },
    { id: 'diagram', label: 'Diagram/Graph-Based Questions', count: 5, marks: 5 },
    { id: 'numerical', label: 'Numerical Problems', count: 5, marks: 5 }
  ]
};

const assignmentsBefore = [];
for (let index = 0; index < 6; index += 1) {
  assignmentsBefore.push(await createAssignment(sampleRequest));
}

const firstAssignment = await waitForAssignmentReady(assignmentsBefore[0].id);

const desktop = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
await desktop.goto(`${baseUrl}/assignments`, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: path.join(outputDir, 'desktop-list.png'), fullPage: true });

await desktop.goto(`${baseUrl}/assignments/new`, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: path.join(outputDir, 'desktop-create.png'), fullPage: true });

await desktop.goto(`${baseUrl}/assignments/${firstAssignment.id}`, { waitUntil: 'networkidle' });
await desktop.waitForSelector('text=Answer Key', { timeout: 30000 });
await desktop.screenshot({ path: path.join(outputDir, 'desktop-output.png'), fullPage: true });

await desktop.goto(`${baseUrl}/assignments`, { waitUntil: 'networkidle' });
await desktop.screenshot({ path: path.join(outputDir, 'desktop-list-filled.png'), fullPage: true });

await browser.close();

console.log(outputDir);
