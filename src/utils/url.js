const PUBLIC_LANGUAGE_SLUGS = {
  'c#': 'csharp',
  'c++': 'cpp',
};

/** Return the stable, URL-safe public slug for a content language. */
export function publicLanguageSlug(language) {
  return PUBLIC_LANGUAGE_SLUGS[language] ?? encodeURIComponent(language);
}

/** Convert a raw slash-delimited content slug to its public URL path. */
export function encodePathSegments(path) {
  const [language, ...segments] = path.split('/');
  return [publicLanguageSlug(language), ...segments.map(segment => encodeURIComponent(segment))].join('/');
}
