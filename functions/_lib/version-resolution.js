/**
 * Resolve an invalid versioned Security Cards path against the generated
 * catalog. Returns a canonical path or null when the request is already
 * canonical or cannot be recovered without guessing.
 */
export function resolveVersionPath(pathname, catalog) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] === 'libraries') {
    return resolveLibraryPath(segments, catalog);
  }
  if (segments[0] === 'downloads') {
    return resolveDownloadPath(segments, catalog);
  }
  return null;
}

function findLibrary(catalog, languageSlug, librarySlug) {
  const language = catalog.languages.find(item => item.slug === languageSlug);
  return language?.libraries.find(item => item.slug === librarySlug) ?? null;
}

function latestVersion(library) {
  return library.versions.find(version => version.versionSlug === library.latestVersion) ?? null;
}

function resolveLibraryPath(segments, catalog) {
  // /libraries/{language}/{library}/{version}/
  if (segments.length < 3 || segments.length > 4) return null;
  const [, languageSlug, librarySlug, requestedVersion] = segments;
  const library = findLibrary(catalog, languageSlug, librarySlug);
  if (!library) return null;
  if (requestedVersion && library.versions.some(version => version.versionSlug === requestedVersion)) {
    return null;
  }
  return latestVersion(library)?.path ?? null;
}

function resolveDownloadPath(segments, catalog) {
  // Language bundles (/downloads/{language}.md) are not versioned.
  if (segments.length < 3 || segments.length > 5) return null;

  const [, languageSlug, librarySegment, versionSegment, categorySegment] = segments;
  if (librarySegment.endsWith('.md')) return null;

  const library = findLibrary(catalog, languageSlug, librarySegment);
  if (!library) return null;

  // /downloads/{language}/{library}/ is a recoverable omitted-version bundle.
  if (!versionSegment) {
    return latestVersion(library)?.bundlePath ?? null;
  }

  const requestedVersion = categorySegment
    ? versionSegment
    : versionSegment.replace(/\.md$/, '');
  if (library.versions.some(version => version.versionSlug === requestedVersion)) {
    return null;
  }

  const latest = latestVersion(library);
  if (!latest) return null;

  // /downloads/{language}/{library}/{bad-version}.md
  if (!categorySegment) {
    if (!versionSegment.endsWith('.md')) return null;
    return latest.bundlePath;
  }

  // /downloads/{language}/{library}/{bad-version}/{category}.md
  if (!categorySegment.endsWith('.md')) return null;
  const category = categorySegment.slice(0, -3);
  if (category === '0_security_blueprint') return latest.blueprintPath;
  return latest.categories.find(card => card.slug === category)?.path ?? null;
}

export function shouldAttemptNormalization(method, status) {
  return (method === 'GET' || method === 'HEAD') && status === 404;
}

