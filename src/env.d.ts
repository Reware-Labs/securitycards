/// <reference types="astro/client" />

// @fontsource CSS side-effect imports have no bundled type declarations.
declare module '@fontsource-variable/geist';
declare module '@fontsource-variable/geist-mono';

interface ImportMetaEnv {
  readonly PUBLIC_ANALYTICS_ENABLED?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
  readonly PUBLIC_ANALYTICS_ENVIRONMENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
