import { encodingForModel } from 'js-tiktoken';

/**
 * Token estimates use GPT-4o's o200k_base encoding. Counts are exact for that
 * tokenizer and intentionally presented as estimates because other models can
 * tokenize the same Markdown differently.
 */
export const TOKENIZER_LABEL = 'GPT-4o tokenizer';
const encoding = encodingForModel('gpt-4o');

export function countMarkdownTokens(markdown: string): number {
  return encoding.encode(markdown).length;
}

export function formatTokenCount(count: number): string {
  if (count < 1000) return count.toLocaleString('en-US');
  const compact = count >= 10_000 ? Math.round(count / 1000) : Math.round(count / 100) / 10;
  return `${compact}k`;
}
