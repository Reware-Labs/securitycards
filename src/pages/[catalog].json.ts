import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLibraryGroups } from '../utils/groups';
import { buildSecurityCardsCatalog } from '../utils/catalog';

export function getStaticPaths() {
  return [
    { params: { catalog: 'catalog' } },
    { params: { catalog: '_catalog-index' } },
  ];
}

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'https://securitycards.rewarelabs.com/').replace(/\/$/, '');
  const groups = await getLibraryGroups();
  const cards = await getCollection('cards');
  const catalog = buildSecurityCardsCatalog(groups, cards, base);

  return new Response(JSON.stringify(catalog), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Robots-Tag': 'noindex',
    },
  });
};
