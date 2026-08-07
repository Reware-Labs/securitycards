import type { LibraryGroup } from './groups';
import { encodePathSegments } from './url.js';

/**
 * The URL prefix every file for one library version hangs off:
 * `{base}/downloads/{language}/{library}/{versionSlug}`.
 *
 * Deliberately has no trailing slash, so all three artifacts are a single
 * concatenation away and an agent never has to reshape the string:
 *   `{prefix}/0_security_blueprint.md`, `{prefix}/{category}.md`, `{prefix}.md`.
 */
export function downloadPrefix(base: string, group: LibraryGroup): string {
  return `${base}/downloads/${encodePathSegments(group.slug)}`;
}

/**
 * One line per supported library version, and nothing else.
 *
 * Card descriptions used to live here, which made a language catalog large
 * enough (72 KB for Python) that an agent whose fetch tool truncates or
 * persists oversized output would silently lose the second half of the file
 * and conclude that a supported library was unsupported. The line carries the
 * category slugs instead, which is the same information a URL list holds at a
 * fraction of the size, and keeps every library on one greppable line.
 */
export function renderLibrarySections(groups: LibraryGroup[], base: string): string[] {
  return groups.map(group =>
    [group.library, group.version, downloadPrefix(base, group), ...group.categories].join(' '),
  );
}
