import {
  resolveVersionPath,
  shouldAttemptNormalization,
} from './version-resolution.js';

const CATALOG_INDEX_PATH = '/_catalog-index.json';
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()',
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function handleVersionedRequest(context) {
  const assetResponse = await context.next();
  if (!shouldAttemptNormalization(context.request.method, assetResponse.status)) {
    return withSecurityHeaders(assetResponse);
  }

  const requestUrl = new URL(context.request.url);
  const catalogUrl = new URL(CATALOG_INDEX_PATH, requestUrl.origin);
  const catalogResponse = await context.env.ASSETS.fetch(catalogUrl);
  if (!catalogResponse.ok) return withSecurityHeaders(assetResponse);

  const catalog = await catalogResponse.json();
  const canonicalPath = resolveVersionPath(requestUrl.pathname, catalog);
  if (!canonicalPath || canonicalPath === requestUrl.pathname) {
    return withSecurityHeaders(assetResponse);
  }

  const location = new URL(canonicalPath, requestUrl.origin);
  location.search = requestUrl.search;

  return new Response(null, {
    status: 307,
    headers: {
      ...SECURITY_HEADERS,
      'Location': location.toString(),
      'Link': `<${location.origin}${location.pathname}>; rel="canonical"`,
      'Cache-Control': 'public, max-age=300',
      'X-Security-Cards-Version-Normalized': 'true',
    },
  });
}
