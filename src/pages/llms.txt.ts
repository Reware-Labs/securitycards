import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getLibraryGroups } from '../utils/groups';
import { buildSecurityCardsCatalog, renderCatalogMarkdown } from '../utils/catalog';

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'https://securitycards.rewarelabs.com/').replace(/\/$/, '');
  const groups = await getLibraryGroups();
  const cards = await getCollection('cards');
  const catalog = buildSecurityCardsCatalog(groups, cards, base);

  return new Response(renderCatalogMarkdown(catalog), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
