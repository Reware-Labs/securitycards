import type { APIRoute } from 'astro';
import { getLibraryGroups } from '../../utils/groups';
import { getLanguages, buildLanguageBundle } from '../../utils/bundles';
import { getLanguageLabel } from '../../utils/language';
import { renderLibrarySections } from '../../utils/llms';
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

  const langLabel = getLanguageLabel(language);
  const encodedLanguage = encodePathSegments(language);
  const totalCards = groups.reduce((n, g) => n + g.count, 0);
  const bundle = await buildLanguageBundle(language, allGroups, base);

  const lines = [
    `# Security Cards — ${langLabel}`,
    '',
    `> Secure-coding rules for ${langLabel} libraries. Each card covers one vulnerability class and is pinned to one library version. Built by RewareLabs for AI coding tools.`,
    '',
    `${totalCards} cards across ${groups.length} ${langLabel} libraries.`,
    '',
    '## How to read this file',
    '',
    'One line per supported library version, in the form:',
    '',
    '    <library> <version> <prefix> <category>...',
    '',
    '`<prefix>` is a URL prefix with no trailing slash. Append to it for raw Markdown:',
    '',
    '    <prefix>/0_security_blueprint.md   secure defaults for the whole library — read this first',
    '    <prefix>/<category>.md             the rules for one category',
    '    <prefix>.md                        every category for that version in one file',
    '',
    'The categories on a line are the complete published set for that version. A category',
    'that is not on the line does not exist for that version and will 404 — do not request it.',
    'Match the version exactly. Never substitute a nearby release.',
    'Fetch with a tool that returns the response verbatim, such as `curl -fsS <url>`.',
    '',
    '## Libraries',
    '',
    ...renderLibrarySections(groups, base),
    '',
    '## Also available',
    '',
    `- Every ${langLabel} card in one file: ${base}/downloads/${encodedLanguage}.md (~${formatTokenCount(bundle.tokenCount)} tokens, ${TOKENIZER_LABEL})`,
    `- Catalog index, every language: ${base}/llms.txt`,
    `- Agent usage guide: ${base}/agent-usage.md`,
    `- Human-readable library pages: ${base}/libraries/${encodedLanguage}/<library>/<version-slug>/`,
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
