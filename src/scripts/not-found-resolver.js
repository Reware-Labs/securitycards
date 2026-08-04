import { resolveVersionPath } from '../../functions/_lib/version-resolution.js';

const CATALOG_INDEX_PATH = '/_catalog-index.json';
const RECOVERABLE_PREFIX = /^\/(?:libraries|downloads)\//;

/**
 * Build a same-origin fallback URL for a version mismatch. Keeping this pure
 * makes the browser behavior testable without a DOM or browser dependency.
 */
export function buildBrowserFallbackUrl(currentHref, catalog) {
  let current;
  try {
    current = new URL(currentHref);
  } catch {
    return null;
  }

  if (!RECOVERABLE_PREFIX.test(current.pathname)) return null;

  const canonicalPath = resolveVersionPath(current.pathname, catalog);
  if (!canonicalPath || canonicalPath === current.pathname) return null;

  const target = new URL(canonicalPath, current.origin);
  target.search = current.search;
  target.hash = current.hash;
  return target.toString();
}

async function recoverVersionMismatch() {
  const status = document.getElementById('not-found-resolver-status');
  if (!RECOVERABLE_PREFIX.test(window.location.pathname)) return;

  if (status) status.hidden = false;

  try {
    const response = await fetch(CATALOG_INDEX_PATH, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('Catalog index unavailable');

    const catalog = await response.json();
    const target = buildBrowserFallbackUrl(window.location.href, catalog);
    if (!target) {
      if (status) status.hidden = true;
      return;
    }

    if (status) status.textContent = 'Supported version found. Redirecting…';
    window.location.replace(target);
  } catch {
    // Recovery is progressive enhancement. The complete 404 experience remains
    // usable when the index cannot be loaded or its data is invalid.
    if (status) status.hidden = true;
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  void recoverVersionMismatch();
}
