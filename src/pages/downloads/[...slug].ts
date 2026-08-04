import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { getLibraryGroups } from '../../utils/groups';
import { buildLanguageBundle, getLanguages, readLibraryBundle } from '../../utils/bundles';
import { encodePathSegments } from '../../utils/url.js';

type Props =
  | { kind: 'library';  language: string; library: string; versionSlug: string }
  | { kind: 'language'; language: string }
  | { kind: 'card';     id: string; library: string; versionSlug: string; category: string };

export async function getStaticPaths() {
  const groups = await getLibraryGroups();
  const cards = await getCollection('cards');
  const languages = getLanguages(groups);

  return [
    ...groups
      .filter(g => g.downloadHref)
      .map(g => ({
        params: { slug: `${encodePathSegments(g.slug)}.md` },
        props: { kind: 'library', language: g.language, library: g.library, versionSlug: g.versionSlug } satisfies Props,
      })),
    ...languages.map(language => ({
      params: { slug: `${encodePathSegments(language)}.md` },
      props: { kind: 'language', language } satisfies Props,
    })),
    ...cards.map(c => {
      const [, library, versionSlug, category] = c.id.split('/');
      return {
        params: { slug: `${encodePathSegments(c.id)}.md` },
        props: { kind: 'card', id: c.id, library, versionSlug, category } satisfies Props,
      };
    }),
  ];
}

function markdown(content: string, filename: string): Response {
  return new Response(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const GET: APIRoute = async ({ props, site }) => {
  const p = props as Props;

  if (p.kind === 'library') {
    const content = await readLibraryBundle(`${p.language}/${p.library}/${p.versionSlug}`);
    return markdown(content, `${p.library}-${p.versionSlug}-securitycards.md`);
  }

  if (p.kind === 'language') {
    const base = (site?.href ?? 'https://securitycards.rewarelabs.com/').replace(/\/$/, '');
    const groups = await getLibraryGroups();
    const bundle = await buildLanguageBundle(p.language, groups, base);
    return markdown(bundle.content, `${p.language}-securitycards.md`);
  }

  const entry = await getEntry('cards', p.id);
  const content = entry?.body ?? '';
  return markdown(content, `${p.library}-${p.versionSlug}-${p.category}.md`);
};
