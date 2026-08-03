/**
 * Astro Content Collection configuration.
 *
 * We use a custom loader (src/loaders/cards.ts) that reads the existing
 * data/**‌/*.md files without requiring any YAML frontmatter. Metadata is
 * derived from the file path and the markdown content itself.
 *
 * Django analogy:
 *   defineCollection  ≈ defining a Model
 *   cardsLoader       ≈ a custom Manager
 *   z.object(schema)  ≈ the model field definitions
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { cardsLoader } from './loaders/cards';

const cards = defineCollection({
  loader: cardsLoader({ dir: './data' }),
  schema: z.object({
    title:       z.string(),
    description: z.string(),
    language:    z.string(),
    library:     z.string(),
    version:     z.string(),
    category:    z.string(),
    repository:  z.string(),
    cardType:    z.enum(['single', 'blueprint']).default('single'),
    cardCount:   z.number(),
    tokenCount:  z.number(),
  }),
});

export const collections = { cards };
