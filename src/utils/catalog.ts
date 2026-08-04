import type { CollectionEntry } from 'astro:content';
import type { LibraryGroup } from './groups';
import { getLanguageLabel } from './language';
import { humanize } from './text';
import { compareVersionSlugs } from './version.js';
import { encodePathSegments, publicLanguageSlug } from './url.js';

type Card = CollectionEntry<'cards'>;

export interface CatalogCard {
  slug: string;
  title: string;
  description: string;
  canonicalUrl: string;
  path: string;
}

export interface CatalogVersion {
  version: string;
  versionSlug: string;
  canonicalUrl: string;
  path: string;
  bundleUrl: string | null;
  bundlePath: string | null;
  blueprintUrl: string | null;
  blueprintPath: string | null;
  categories: CatalogCard[];
}

export interface CatalogLibrary {
  slug: string;
  name: string;
  latestVersion: string;
  versions: CatalogVersion[];
}

export interface CatalogLanguage {
  slug: string;
  label: string;
  catalogUrl: string;
  bundleUrl: string;
  libraries: CatalogLibrary[];
}

export interface SecurityCardsCatalog {
  schemaVersion: 2;
  usageGuideUrl: string;
  catalogUrl: string;
  jsonCatalogUrl: string;
  languages: CatalogLanguage[];
}

function absoluteUrl(base: string, path: string): string {
  return `${base}${path}`;
}

/** Build the catalog used by all human- and agent-facing endpoints. */
export function buildSecurityCardsCatalog(
  groups: LibraryGroup[],
  cards: Card[],
  baseUrl: string,
): SecurityCardsCatalog {
  const base = baseUrl.replace(/\/$/, '');
  const cardsByGroup = new Map<string, Card[]>();

  for (const card of cards) {
    const groupSlug = card.id.split('/').slice(0, 3).join('/');
    const grouped = cardsByGroup.get(groupSlug) ?? [];
    grouped.push(card);
    cardsByGroup.set(groupSlug, grouped);
  }

  const languageMap = new Map<string, Map<string, LibraryGroup[]>>();
  for (const group of groups) {
    const libraries = languageMap.get(group.language) ?? new Map<string, LibraryGroup[]>();
    const versions = libraries.get(group.library) ?? [];
    versions.push(group);
    libraries.set(group.library, versions);
    languageMap.set(group.language, libraries);
  }

  const languages = [...languageMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([language, libraryMap]): CatalogLanguage => {
      const libraries = [...libraryMap.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([library, versionGroups]): CatalogLibrary => {
          const versions = versionGroups
            .sort((left, right) => compareVersionSlugs(right.versionSlug, left.versionSlug))
            .map((group): CatalogVersion => {
              const groupCards = cardsByGroup.get(group.slug) ?? [];
              const blueprint = groupCards.find(card => card.data.cardType === 'blueprint');
              const categories = groupCards
                .filter(card => card.data.cardType === 'single')
                .sort((left, right) => left.data.category.localeCompare(right.data.category))
                .map((card): CatalogCard => {
                  const path = `/downloads/${encodePathSegments(card.id)}.md`;
                  return {
                    slug: card.data.category,
                    title: humanize(card.data.category),
                    description: card.data.description.trim()
                      || `${humanize(card.data.category)} guidance for ${group.library}.`,
                    canonicalUrl: absoluteUrl(base, path),
                    path,
                  };
                });

              const encodedGroupSlug = encodePathSegments(group.slug);
              const path = `/libraries/${encodedGroupSlug}/`;
              const bundlePath = group.downloadHref;
              const blueprintPath = blueprint
                ? `/downloads/${encodedGroupSlug}/0_security_blueprint.md`
                : null;

              return {
                version: group.version,
                versionSlug: group.versionSlug,
                canonicalUrl: absoluteUrl(base, path),
                path,
                bundleUrl: bundlePath ? absoluteUrl(base, bundlePath) : null,
                bundlePath,
                blueprintUrl: blueprintPath ? absoluteUrl(base, blueprintPath) : null,
                blueprintPath,
                categories,
              };
            });

          return {
            slug: library,
            name: humanize(library),
            latestVersion: versions[0].versionSlug,
            versions,
          };
        });

      return {
        slug: publicLanguageSlug(language),
        label: getLanguageLabel(language),
        catalogUrl: absoluteUrl(base, `/llms/${publicLanguageSlug(language)}.txt`),
        bundleUrl: absoluteUrl(base, `/downloads/${publicLanguageSlug(language)}.md`),
        libraries,
      };
    });

  return {
    schemaVersion: 2,
    usageGuideUrl: absoluteUrl(base, '/agent-usage.md'),
    catalogUrl: absoluteUrl(base, '/llms.txt'),
    jsonCatalogUrl: absoluteUrl(base, '/catalog.json'),
    languages,
  };
}

export function renderCatalogMarkdown(catalog: SecurityCardsCatalog): string {
  const libraryCount = catalog.languages.reduce(
    (total, language) => total + language.libraries.length,
    0,
  );
  const versionCount = catalog.languages.reduce(
    (total, language) => total + language.libraries.reduce(
      (subtotal, library) => subtotal + library.versions.length,
      0,
    ),
    0,
  );
  const cardCount = catalog.languages.reduce(
    (total, language) => total + language.libraries.reduce(
      (libraryTotal, library) => libraryTotal + library.versions.reduce(
        (versionTotal, version) => versionTotal + version.categories.length,
        0,
      ),
      0,
    ),
    0,
  );

  const lines = [
    '# Security Cards Catalog',
    '',
    '> Complete machine-readable inventory for Security Cards by RewareLabs.',
    '',
    `Canonical catalog: ${catalog.catalogUrl}`,
    `JSON catalog: ${catalog.jsonCatalogUrl}`,
    `Platform usage guide: ${catalog.usageGuideUrl}`,
    '',
    `Supported inventory: ${catalog.languages.length} languages, ${libraryCount} libraries, ${versionCount} library versions, and ${cardCount} category files.`,
    '',
    '## Usage',
    '',
    '- Prefer the narrowest canonical URL that covers the task.',
    '- Library and card URLs are version-pinned.',
    '- An unavailable or malformed version redirects to the latest supported version for the exact language and library.',
    '',
    '## Languages',
    '',
  ];

  for (const language of catalog.languages) {
    lines.push(`- [${language.label}](${language.catalogUrl})`);
  }

  for (const language of catalog.languages) {
    lines.push('');
    lines.push(`## ${language.label}`);
    lines.push('');
    lines.push(`Language catalog: ${language.catalogUrl}`);
    lines.push(`All ${language.label} cards: ${language.bundleUrl}`);

    for (const library of language.libraries) {
      for (const version of library.versions) {
        const latest = version.versionSlug === library.latestVersion ? ' — latest supported' : '';
        lines.push('');
        lines.push(`### ${library.name} ${version.version}${latest}`);
        lines.push('');
        lines.push(`- Canonical library page: ${version.canonicalUrl}`);
        if (version.bundleUrl) {
          lines.push(`- Combined Markdown bundle: ${version.bundleUrl}`);
        }
        if (version.blueprintUrl) {
          lines.push(`- Security Blueprint: ${version.blueprintUrl}`);
        }
        for (const card of version.categories) {
          lines.push(`- [${card.title}](${card.canonicalUrl}): ${card.description}`);
        }
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

export function renderUsageGuideMarkdown(catalog: SecurityCardsCatalog): string {
  const lines = [
    '# Security Cards Agent Usage',
    '',
    '> A concise guide for AI agents using Security Cards in software projects.',
    '',
    `- Complete catalog: ${catalog.catalogUrl}`,
    `- JSON catalog: ${catalog.jsonCatalogUrl}`,
    `- This guide: ${catalog.usageGuideUrl}`,
    '',
    '## Recommended: use the Security Cards skill',
    '',
    'The `securitycards` skill gives a coding agent this workflow and includes a small catalog snapshot. The snapshot can confirm what was supported when the skill was released, but the live catalog and cards remain the source of truth.',
    '',
    'Install it globally from the [RewareLabs/securitycards repository](https://github.com/Reware-Labs/securitycards):',
    '',
    '```bash',
    'npx skills add Reware-Labs/securitycards --skill securitycards -g',
    '```',
    '',
    'Remove `-g` to install it only for the current project. If the skill is already installed, use it for the task. If installation is not available or has not been authorized, continue with the instructions below.',
    '',
    '## How to use Security Cards',
    '',
    '1. Check the project’s manifests and lockfiles to identify the libraries and versions actually in use.',
    `2. Find those versions in the [JSON catalog](${catalog.jsonCatalogUrl}). If needed, use the [text catalog](${catalog.catalogUrl}) instead.`,
    '3. Use cards that match the project’s exact library version. If that version is not listed, explain what is unsupported and show the versions that are available instead of borrowing guidance from another version.',
    '4. When starting a project or learning a library, begin with its Security Blueprint. For focused work, choose the category card closest to the task. Use the full library bundle when several categories are relevant.',
    '5. Apply the relevant **secure rules**, run appropriate tests or checks, and review the finished code against the rules used.',
    '6. Include links to every Security Blueprint or card used.',
    '',
    'If the site cannot be reached, an installed skill’s catalog snapshot can only show whether a library was supported when the skill was released. Wait for the live cards before applying security guidance, because the snapshot may be out of date.',
    '',
    '## Common workflows',
    '',
    '### 1. Starting a project',
    '',
    '- Select exact supported versions and read each library’s Security Blueprint before establishing architecture or defaults.',
    '- Create persistent project instructions when useful and cite the sources used in the implementation plan.',
    '',
    '### 2. Building a feature',
    '',
    '- Confirm resolved dependency versions, fetch the most focused cards that apply, follow their secure rules, and verify the implementation.',
    '',
    '### 3. Reviewing an existing codebase',
    '',
    '- Check the project’s dependencies, compare the relevant code with the applicable secure rules, and report concrete findings with severity, location, a suggested fix, and links to the cards used.',
  ];

  return `${lines.join('\n')}\n`;
}
