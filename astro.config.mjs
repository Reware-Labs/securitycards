import { defineConfig } from 'astro/config';
import { shikiConfig } from './src/utils/shiki.ts';

export default defineConfig({
  output: 'static',
  site: 'https://securitycards.rewarelabs.com',
  markdown: {
    syntaxHighlight: 'shiki',
    shikiConfig,
  },
});
