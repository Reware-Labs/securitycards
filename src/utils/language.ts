/**
 * Display label for a card's language.
 *
 * Known languages get their proper display casing; any language not yet
 * listed here falls back to a capitalized slug (e.g. "rust" -> "Rust") so a
 * brand-new data/{language}/ folder renders correctly with zero code changes.
 */
const LABELS: Record<string, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python:     'Python',
  go:         'Go',
  java:       'Java',
  php:        'PHP',
};

export function getLanguageLabel(language: string): string {
  return LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}
