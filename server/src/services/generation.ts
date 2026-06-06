import type { CreateAssignmentRequest, QuestionPaper } from '@shared/assignment';
import { buildPrompt, buildStructuredAssessment } from '@shared/paper-builder';
import { questionPaperSchema } from '@shared/assignment';
import { config } from '../config.js';
import { withServerRetry, shouldRetryError } from '../utils/retry.js';

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

async function generateWithOpenAI(prompt: string): Promise<QuestionPaper> {
  return withServerRetry(
    async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: config.openaiModel,
          temperature: 0.35,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content:
                'You generate school assessment papers. Return only a JSON object matching the requested schema.'
            },
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI request failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenAI returned an empty response.');
      }

      const parsed = JSON.parse(stripMarkdownFences(content));
      return questionPaperSchema.parse({
        ...parsed,
        generatedAt: parsed.generatedAt ?? new Date().toISOString()
      });
    },
    'OpenAI Question Generation',
    {
      maxAttempts: 3,
      delayMs: 500,
      shouldRetry: shouldRetryError
    }
  );
}

export async function generateQuestionPaper(request: CreateAssignmentRequest): Promise<{
  paper: QuestionPaper;
  prompt: string;
  source: 'openai' | 'local';
}> {
  const prompt = buildPrompt(request);

  if (config.openaiKey) {
    try {
      const paper = await generateWithOpenAI(prompt);
      return { paper, prompt, source: 'openai' };
    } catch (error) {
      console.warn(`OpenAI generation failed, using local generator instead. ${(error as Error).message}`);
    }
  }

  return {
    paper: buildStructuredAssessment(request),
    prompt,
    source: 'local'
  };
}
