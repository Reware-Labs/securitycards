/**
 * Custom Astro content loader for security card markdown files.
 *
 * Reads `data/{language}/{library}/{version}/{category}.md` without requiring
 * any YAML frontmatter. All metadata is derived from the file path and the
 * existing markdown content — the data/ directory stays completely untouched.
 * The language segment is not a fixed list: any directory name works, so a
 * brand-new `data/{newLanguage}/...` tree is picked up automatically.
 *
 * Django analogy: this is like a custom Manager that reads fixture files.
 */

import type { Loader } from 'astro/loaders';
import { glob } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';
import { countMarkdownTokens } from '../utils/tokens';
import { formatVersionLabel } from '../utils/version.js';

// A type alias (not interface) so it stays structurally assignable to the
// loader store's Record<string, unknown> data slot.
export type CardData = {
  title:       string;
  description: string;
  language:    string;
  library:     string;
  version:     string;     // display version e.g. "v1.18.1"
  category:    string;     // kebab-case e.g. "injection"
  repository:  string;
  cardType:    'single' | 'blueprint';
  cardCount:   number;     // number of individual ### cards inside this category file; 1 for blueprints
  tokenCount:  number;     // GPT-4o tokenizer count for the complete raw Markdown file
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/** Extract the repository URL from lines like:  Repository: `https://...` */
function parseRepository(text: string): string {
  const match = text.match(/Repository:\s*`([^`]+)`/);
  return match?.[1] ?? '';
}

/**
 * Extract the human-readable card title.
 * For single cards: first ### heading.
 * For blueprints: we construct it from the library name.
 */
function parseTitle(text: string, library: string, isBlueprint: boolean): string {
  if (isBlueprint) {
    return `${capitalize(library)} Security Blueprint`;
  }
  const match = text.match(/^###\s+(.+)$/m);
  return match?.[1]?.trim() ?? capitalize(library);
}

/**
 * Extract the short description used in card grid excerpts.
 * For single cards: the paragraph that follows "**Use when**".
 * For blueprints: the paragraph that follows "## Security posture".
 */
function parseDescription(text: string, isBlueprint: boolean): string {
  if (isBlueprint) {
    // First paragraph after "## Security posture"
    const match = text.match(/##\s+Security posture\s*\n+([^\n#]+)/);
    return truncate(match?.[1]?.trim() ?? '', 200);
  }
  // Paragraph after **Use when** (skip blank line)
  const match = text.match(/\*\*Use when\*\*\s*\n+([^\n*#]+)/);
  return truncate(match?.[1]?.trim() ?? '', 200);
}

/** Count the individual ### cards bundled inside a category file. */
function countCards(text: string, isBlueprint: boolean): number {
  if (isBlueprint) return 1;
  const matches = text.match(/^###\s+/gm);
  return matches ? matches.length : 1;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max).trimEnd() + '…' : s;
}

/**
 * Strip the markdown file preamble so the rendered card shows only content.
 * Single cards start with "# Security cards / Repository / Category / ## category" —
 * we drop everything before the first ### heading.
 * Blueprints and the "all categories" combined file start with "# ... / Repository" —
 * we drop everything before the first ## heading.
 * Exported for reuse by the library page, which renders the combined
 * "all categories" file (1_all_categories.md) outside the content collection.
 */
export function stripPreamble(text: string, headingLevel: 2 | 3 = 3): string {
  const pattern = headingLevel === 2 ? /^##\s+/m : /^###\s+/m;
  const match = pattern.exec(text);
  return match ? text.slice(match.index).trimStart() : text;
}

/**
 * Drop a single card's first ### heading line — its text is already shown
 * as the panel's <h2> title (see parseTitle), so leaving it in the rendered
 * body would show it twice. Any later ### headings (a category bundling more
 * than one card) are left as-is, since those have no separate title element.
 */
function stripFirstHeading(text: string): string {
  return text.replace(/^###\s+.*\n?/, '');
}

// ---------------------------------------------------------------------------
// Loader factory
// ---------------------------------------------------------------------------

interface CardsLoaderOptions {
  /** Path to the data directory, relative to the project root. Default: './data' */
  dir?: string;
}

export function cardsLoader(opts: CardsLoaderOptions = {}): Loader {
  const dataDir = opts.dir ?? './data';

  return {
    name: 'cards-loader',

    async load({ store, config, renderMarkdown, watcher }) {
      // config.root is a file:// URL; .pathname gives the absolute FS path
      const rootPath   = config.root.pathname.replace(/\/$/, '');
      const absDataDir = join(rootPath, dataDir);

      async function syncCards() {
        // Find all .md files, skip 1_all_categories.md and all_categories.md files
        const mdFiles: string[] = [];
        for await (const entry of glob('**/*.md', { cwd: absDataDir })) {
          if (!entry.includes('1_all_categories') && !entry.endsWith('all_categories.md')) {
            mdFiles.push(join(absDataDir, entry));
          }
        }

        store.clear();

        for (const filePath of mdFiles) {
          // Derive taxonomy from path segments
          // absDataDir/language/library/version/category.md
          const rel = relative(absDataDir, filePath);           // e.g. "javascript/axios/v1-18-1/injection.md"
          const parts = rel.split('/');                          // ["javascript","axios","v1-18-1","injection.md"]

          if (parts.length !== 4) continue;

          const [language, library, versionSlug, filename] = parts;
          const category = basename(filename, '.md');            // "injection"
          const isBlueprint = category === '0_security_blueprint';

          const body = await readFile(filePath, 'utf-8');

          // Build the id used as the URL slug: "javascript/axios/v1-18-1/injection"
          const id = rel.replace(/\.md$/, '');

          const data: CardData = {
            title:       parseTitle(body, library, isBlueprint),
            description: parseDescription(body, isBlueprint),
            language,
            library,
            version:     formatVersionLabel(versionSlug),
            category,
            repository:  parseRepository(body),
            cardType:    isBlueprint ? 'blueprint' : 'single',
            cardCount:   countCards(body, isBlueprint),
            tokenCount:  countMarkdownTokens(body),
          };

          // filePath must be relative to the project root
          const relFilePath = relative(rootPath, filePath);
          // Single cards: drop the leading ### heading — the library page now
          // shows it as the panel's <h2> title, so keeping it in the body too
          // would render it twice. Blueprints keep their ## structure.
          const contentSource = isBlueprint
            ? stripPreamble(body, 2)
            : stripFirstHeading(stripPreamble(body, 3));
          const rendered = await renderMarkdown(contentSource);
          store.set({ id, data, body, filePath: relFilePath, rendered });
        }

      }

      await syncCards();

      // Dev only: `watcher` is undefined during `astro build`. Re-sync on any
      // add/change/unlink under data/ so new cards, libraries, or languages
      // appear without restarting the dev server.
      if (watcher) {
        watcher.add(absDataDir);
        const onChange = (changedPath: string) => {
          if (changedPath.startsWith(absDataDir) && changedPath.endsWith('.md')) {
            syncCards();
          }
        };
        watcher.on('add', onChange);
        watcher.on('change', onChange);
        watcher.on('unlink', onChange);
      }
    },
  };
}
