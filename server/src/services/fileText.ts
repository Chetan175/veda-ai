import type { Express } from 'express';

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export async function extractSourceText(file?: Express.Multer.File | null): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }

  if (file.mimetype.startsWith('text/') || file.originalname.toLowerCase().endsWith('.txt')) {
    return normalizeWhitespace(file.buffer.toString('utf8')).slice(0, 8000);
  }

  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    const module = await import('pdf-parse');
    const pdfParse = module.default;
    const result = await pdfParse(file.buffer);
    return normalizeWhitespace(result.text).slice(0, 8000);
  }

  return normalizeWhitespace(file.buffer.toString('utf8')).slice(0, 8000);
}
