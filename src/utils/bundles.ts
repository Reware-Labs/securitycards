import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { LibraryGroup } from "./groups";
import { getLanguageLabel } from "./language";
import { encodePathSegments } from "./url.js";
import {
  countMarkdownTokens,
  formatTokenCount,
  TOKENIZER_LABEL,
} from "./tokens";

const dataDir = join(process.cwd(), "data");

export interface LanguageBundle {
  language: string;
  libraries: LibraryGroup[];
  content: string;
  tokenCount: number;
  byteCount: number;
}

export async function buildLanguageBundle(
  language: string,
  groups: LibraryGroup[],
  base: string,
): Promise<LanguageBundle> {
  const libraries = groups
    .filter((g) => g.language === language && g.downloadHref)
    .sort((a, b) => a.library.localeCompare(b.library));

  const bodies = await Promise.all(
    libraries.map((g) =>
      readFile(`${dataDir}/${g.slug}/1_all_categories.md`, "utf-8"),
    ),
  );

  const langLabel = getLanguageLabel(language);
  const encodedLanguage = encodePathSegments(language);
  const libList = libraries.map((g) => `${g.library} ${g.version}`).join(", ");
  const body = bodies.join("\n\n---\n\n");
  const tokenCount = countMarkdownTokens(body);

  const header = [
    `# Security Cards — ${langLabel}`,
    "",
    `> Combined secure-coding cards for every ${langLabel} library in the catalog.`,
    `> Source: ${base}/downloads/${encodedLanguage}.md`,
    `> Catalog: ${base}/llms/${encodedLanguage}.txt`,
    `> Complete catalog: ${base}/llms.txt`,
    `> Agent usage guide: ${base}/agent-usage.md`,
    `> Libraries (${libraries.length}): ${libList}`,
    `> Size: ~${formatTokenCount(tokenCount)} tokens (${TOKENIZER_LABEL}). Prefer a per-library or single-card file if your context is limited.`,
    "",
    "---",
    "",
    "",
  ].join("\n");

  const content = header + body + "\n";

  return {
    language,
    libraries,
    content,
    tokenCount,
    byteCount: Buffer.byteLength(content, "utf-8"),
  };
}

export function getLanguages(groups: LibraryGroup[]): string[] {
  return [...new Set(groups.map((g) => g.language))];
}

export function readLibraryBundle(slug: string): Promise<string> {
  return readFile(`${dataDir}/${slug}/1_all_categories.md`, "utf-8");
}
