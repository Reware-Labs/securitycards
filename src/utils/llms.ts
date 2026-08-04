import type { CollectionEntry } from 'astro:content';
import type { LibraryGroup } from './groups';
import { getLanguageLabel } from './language';
import { humanize } from './text';
import { encodePathSegments } from './url.js';

export type Card = CollectionEntry<'cards'>;

export function indexCardsByGroup(cards: Card[]): Map<string, Card[]> {
  const byGroup = new Map<string, Card[]>();
  for (const card of cards) {
    if (card.data.cardType !== 'single') continue;
    const slug = card.id.split('/').slice(0, 3).join('/');
    const list = byGroup.get(slug) ?? [];
    list.push(card);
    byGroup.set(slug, list);
  }
  return byGroup;
}

export function renderLibrarySections(
  groups: LibraryGroup[],
  byGroup: Map<string, Card[]>,
  base: string,
): string[] {
  const lines: string[] = [];
  for (const g of groups) {
    const langLabel = getLanguageLabel(g.language);
    const encodedGroupSlug = encodePathSegments(g.slug);
    lines.push(`## ${langLabel} / ${g.library} ${g.version}`);
    if (g.downloadHref) {
      lines.push(`Download all cards (markdown): ${base}${g.downloadHref}`);
    }
    lines.push(`Library page: ${base}/libraries/${encodedGroupSlug}/`);
    if (g.hasBlueprint) {
      lines.push(
        `- [Security Blueprint](${base}/downloads/${encodedGroupSlug}/0_security_blueprint.md): high-level secure-by-default posture and essential rules for ${g.library} ${g.version}.`,
      );
    }
    const groupCards = (byGroup.get(g.slug) ?? [])
      .sort((a, b) => a.data.category.localeCompare(b.data.category));
    for (const card of groupCards) {
      const desc = card.data.description?.trim() || `${humanize(card.data.category)} guidance for ${g.library}.`;
      lines.push(`- [${humanize(card.data.category)}](${base}/downloads/${encodePathSegments(card.id)}.md): ${desc}`);
    }
    lines.push('');
  }
  return lines;
}
