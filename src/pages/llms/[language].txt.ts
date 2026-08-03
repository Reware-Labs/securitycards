import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLibraryGroups } from '../../utils/groups';
import { getLanguages, buildLanguageBundle } from '../../utils/bundles';
import { getLanguageLabel } from '../../utils/language';
import { indexCardsByGroup, renderLibrarySections } from '../../utils/llms';
import { formatTokenCount, TOKENIZER_LABEL } from '../../utils/tokens';
import { encodePathSegments } from '../../utils/url.js';

export async function getStaticPaths() {
  const groups = await getLibraryGroups();
  return getLanguages(groups).map(language => ({
    params: { language: encodePathSegments(language) },
    props: { language },
  }));
}

export const GET: APIRoute = async ({ props, site }) => {
  const base = (site?.href ?? 'https://securitycards.rewarelabs.com/').replace(/\/$/, '');
  const language = props.language as string;
  const allGroups = await getLibraryGroups();
  const groups = allGroups.filter(g => g.language === language);
  const cards = await getCollection('cards');
  const byGroup = indexCardsByGroup(cards.filter(c => c.data.language === language));

  const langLabel = getLanguageLabel(language);
  const encodedLanguage = encodePathSegments(language);
  const totalCards = groups.reduce((n, g) => n + g.count, 0);
  const bundle = await buildLanguageBundle(language, allGroups, base);

  const lines: string[] = [];
  lines.push(`# Security Cards — ${langLabel}`);
  lines.push('');
  lines.push(`> Secure-coding cards for ${langLabel} libraries. Each card covers one vulnerability class and is pinned to a specific library version. Built by RewareLabs for AI coding tools.`);
  lines.push('');
  lines.push(`${totalCards} cards across ${groups.length} ${langLabel} libraries. Each library has a Security Blueprint, a combined all-categories file, and one card per category — all as raw markdown at the links below.`);
  lines.push('');
  lines.push('## Bundles');
  lines.push(`- All ${langLabel} cards in one file: ${base}/downloads/${encodedLanguage}.md (~${formatTokenCount(bundle.tokenCount)} tokens, ${TOKENIZER_LABEL})`);
  lines.push(`- Complete catalog (every language): ${base}/llms.txt`);
  lines.push(`- Agent usage guide: ${base}/agent-usage.md`);
  lines.push('');
  lines.push(...renderLibrarySections(groups, byGroup, base));

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
