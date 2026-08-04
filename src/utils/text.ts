/** Acronym-aware display labels for machine-friendly kebab-case values. */
const ACRONYMS: Record<string, string> = {
  aes: 'AES',
  api: 'API',
  csrf: 'CSRF',
  dns: 'DNS',
  html: 'HTML',
  http: 'HTTP',
  https: 'HTTPS',
  jwt: 'JWT',
  kdf: 'KDF',
  ocsp: 'OCSP',
  oauth2: 'OAuth2',
  crl: 'CRL',
  rsa: 'RSA',
  sql: 'SQL',
  ssh: 'SSH',
  uri: 'URI',
  url: 'URL',
  utc: 'UTC',
};

export function humanize(s: string): string {
  return s
    .split('-')
    .map(word => ACRONYMS[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
