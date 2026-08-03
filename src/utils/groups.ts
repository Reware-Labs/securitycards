import { getCollection } from "astro:content";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { encodePathSegments } from "./url.js";

const dataDir = join(process.cwd(), "data");

export interface LibraryGroup {
  language: string;
  library: string;
  version: string; // display version, e.g. "3.1.3"
  versionSlug: string; // folder slug, e.g. "3-1-3"
  slug: string; // "python/flask/3-1-3"
  count: number; // individual (non-blueprint) cards
  categories: string[]; // category slugs, alphabetical
  hasBlueprint: boolean;
  /** /downloads/{slug}.md when a combined all-categories file exists, else null. */
  downloadHref: string | null;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** All libraries, grouped and sorted by language then library name. */
export async function getLibraryGroups(): Promise<LibraryGroup[]> {
  const cards = await getCollection("cards");

  const map = new Map<string, LibraryGroup & { _categories: Set<string> }>();
  for (const card of cards) {
    const [language, library, versionSlug] = card.id.split("/");
    const slug = `${language}/${library}/${versionSlug}`;
    let group = map.get(slug);
    if (!group) {
      const hasDownload = await fileExists(
        `${dataDir}/${slug}/1_all_categories.md`,
      );
      group = {
        language,
        library,
        version: card.data.version,
        versionSlug,
        slug,
        count: 0,
        categories: [],
        _categories: new Set<string>(),
        hasBlueprint: false,
        downloadHref: hasDownload
          ? `/downloads/${encodePathSegments(slug)}.md`
          : null,
      };
      map.set(slug, group);
    }
    if (card.data.cardType === "blueprint") {
      group.hasBlueprint = true;
    } else {
      group.count += card.data.cardCount;
      group._categories.add(card.data.category);
    }
  }

  const groups = [...map.values()].map((g) => {
    g.categories = [...g._categories].sort();
    return g as LibraryGroup;
  });

  return groups.sort(
    (a, b) =>
      a.language.localeCompare(b.language) ||
      a.library.localeCompare(b.library),
  );
}
