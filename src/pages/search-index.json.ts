/**
 * Static search index for the ⌘K command palette.
 *
 * Emits one compact entry per card (plus one per security blueprint) at build
 * time, served as /search-index.json. The palette (command-palette.ts) fetches
 * this once on first open and scores it client-side — no server, ~one entry per
 * category card. Keys are short to keep the payload small:
 *   t = title, l = library, g = language, v = version (display),
 *   c = humanized category, u = deep-link URL, k = inner ### card titles.
 */
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLanguageLabel } from '../utils/language';
import { humanize } from '../utils/text';
import { encodePathSegments } from '../utils/url.js';

interface SearchEntry {
  t: string;
  l: string;
  g: string;   // language label, e.g. "Python"
  v: string;
  c: string;
  u: string;
  k: string[];
}

export const GET: APIRoute = async () => {
  const cards = await getCollection('cards');
  const entries: SearchEntry[] = [];

  for (const card of cards) {
    const [language, library, versionSlug, category] = card.id.split('/');
    const base = `/libraries/${encodePathSegments(`${language}/${library}/${versionSlug}`)}/`;

    if (card.data.cardType === 'blueprint') {
      entries.push({
        t: card.data.title,
        l: card.data.library,
        g: getLanguageLabel(card.data.language),
        v: card.data.version,
        c: 'Security blueprint',
        u: `${base}#blueprint`,
        k: [],
      });
      continue;
    }

    // Inner "### <title>" headings bundled inside this category file.
    const innerTitles = (card.body?.match(/^###\s+(.+)$/gm) ?? [])
      .map(l => l.replace(/^###\s+/, '').trim());

    entries.push({
      t: card.data.title,
      l: card.data.library,
      g: getLanguageLabel(card.data.language),
      v: card.data.version,
      c: humanize(category),
      u: `${base}#${category}`,
      k: innerTitles,
    });
  }

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
