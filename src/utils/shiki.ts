/**
 * Shared Shiki configuration for markdown code highlighting.
 *
 * `defaultColor: false` makes Shiki emit BOTH themes as CSS custom properties
 * (`--shiki-light` / `--shiki-dark`) on every token instead of baking one
 * theme's colors in. detail.css then picks the right variable per `data-theme`,
 * so code blocks re-theme instantly with the rest of the site (no re-render).
 *
 * Used by:
 *   - astro.config.mjs markdown config (collection-rendered card panels)
 *   - src/pages/libraries/[...slug].astro (the standalone all-categories panel,
 *     whose satteri processor does NOT inherit the project markdown config)
 *   - the <Code> component on the integration page
 */
export const shikiConfig = {
  themes: {
    light: 'vitesse-light',
    dark: 'vitesse-dark',
  },
  defaultColor: false,
  langAlias: {
    env: 'dotenv',
    caddyfile: 'nginx',
    gotemplate: 'go',
    jinja2: 'jinja',
  },
} as const;

export const normalizeShikiLang = (language: string) =>
  shikiConfig.langAlias[language.toLowerCase() as keyof typeof shikiConfig.langAlias] ?? language;
