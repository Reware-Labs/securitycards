#!/usr/bin/env node
/**
 * Security card linter.
 *
 * Category-card content checks intentionally mirror the generation repository.
 * Blueprints and generated all-category bundles are required in each version
 * directory but their content is not evaluated here.
 */

import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DATA_DIR = join(ROOT, "data");
const BLUEPRINT_FILE = "0_security_blueprint.md";
const ALL_CATEGORIES_FILE = "1_all_categories.md";
const CATEGORY_FILENAME = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const REPOSITORY_LINE = /^Repository:\s*`([^`]*)`$/m;
const TRAILING_WHITESPACE = /[ \t]+$/gm;

const errors = [];
const record = (file, rule, detail, line = null) =>
  errors.push({ file: relative(ROOT, file), rule, detail, line });

async function walk(dir) {
  const out = [];
  for (const name of await readdir(dir)) {
    const full = join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function lineNumber(body, offset) {
  return body.slice(0, offset).split("\n").length;
}

function normalizeMarkdownWhitespace(body) {
  let fixCount = 0;
  const withoutTrailing = body.replace(TRAILING_WHITESPACE, () => {
    fixCount += 1;
    return "";
  });
  const normalized = withoutTrailing.replace(/\n+$/, "") + "\n";
  if (normalized !== withoutTrailing) fixCount += 1;
  return { body: normalized, fixCount };
}

function checkCommon(file, body) {
  if (!body.endsWith("\n")) {
    record(file, "final-newline", "file must end with exactly one newline");
  } else if (body.endsWith("\n\n")) {
    record(file, "final-newline", "file has extra blank lines at the end");
  }

  let activeFenceLength = null;
  let activeFenceLine = null;
  const lines = body.split(/\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const currentLine = index + 1;
    const fence = line.match(/^(`{3,})/);
    const insideCode = activeFenceLength !== null;

    if (line.includes("\t") && !insideCode) {
      record(file, "tabs-used", "replace tabs with spaces", currentLine);
    }
    if (line !== line.trimEnd()) {
      record(file, "trailing-whitespace", "remove trailing whitespace", currentLine);
    }

    if (fence) {
      const fenceLength = fence[1].length;
      if (activeFenceLength === null) {
        activeFenceLength = fenceLength;
        activeFenceLine = currentLine;
      } else if (fenceLength >= activeFenceLength) {
        activeFenceLength = null;
        activeFenceLine = null;
      }
    }
  }

  if (activeFenceLine !== null) {
    record(
      file,
      "unclosed-code-block",
      "add a matching closing code fence",
      activeFenceLine,
    );
  }

  const repository = REPOSITORY_LINE.exec(body);
  if (!repository) {
    record(file, "repository-missing", "add a `Repository: `<source>`` line");
  } else if (!repository[1].trim()) {
    record(
      file,
      "repository-empty",
      "repository reference cannot be empty",
      lineNumber(body, repository.index),
    );
  }
}

function cardBlocks(body) {
  const headingPattern = /^###\s+(.+?)\s*$/gm;
  const headings = [...body.matchAll(headingPattern)];
  return headings.map((heading, index) => ({
    title: heading[1],
    text: body.slice(
      heading.index,
      index + 1 < headings.length ? headings[index + 1].index : body.length,
    ),
    line: lineNumber(body, heading.index),
  }));
}

function checkCategoryFile(file, body) {
  checkCommon(file, body);

  if (!body.startsWith("# Security cards\n")) {
    record(file, "header-format", "file must start with `# Security cards`", 1);
  }
  if (!/^Category:\s*\S/m.test(body)) {
    record(file, "category-missing", "category exports require a `Category:` line");
  }

  const cards = cardBlocks(body);
  if (cards.length === 0) {
    record(file, "no-cards", "file contains no `###` security card headings");
    return 0;
  }

  for (const card of cards) {
    for (const [marker, rule] of [
      ["**Use when**", "use-when-missing"],
      ["**Secure rules**", "secure-rules-missing"],
    ]) {
      if (!card.text.includes(marker)) {
        record(
          file,
          rule,
          `card "${card.title}" is missing ${marker}`,
          card.line,
        );
      }
    }

    const ruleNumbers = [
      ...card.text.matchAll(/^\*\*Rule\s+(\d+):\s*.+\*\*$/gm),
    ].map((match) => Number(match[1]));

    if (card.text.includes("**Secure rules**") && ruleNumbers.length === 0) {
      record(
        file,
        "no-secure-rules",
        `card "${card.title}" has no numbered secure rules`,
        card.line,
      );
    } else if (
      ruleNumbers.some((number, index) => number !== index + 1)
    ) {
      record(
        file,
        "rule-numbering",
        `card "${card.title}" rules must be numbered consecutively from 1`,
        card.line,
      );
    }
  }

  return cards.length;
}

async function main() {
  const fix = process.argv.slice(2).includes("--fix");

  try {
    await stat(DATA_DIR);
  } catch {
    console.error("lint-cards: data/ directory not found");
    process.exit(1);
  }

  const all = await walk(DATA_DIR);
  const versionDirs = new Map();
  let categoryFileCount = 0;
  let cardCount = 0;
  let fixedCount = 0;

  for (const file of all) {
    const rel = relative(DATA_DIR, file);
    const parts = rel.split(sep);
    const name = parts.at(-1);

    if (name.startsWith(".")) continue;
    if (!name.endsWith(".md")) {
      record(file, "unexpected-file", "non-markdown file under data/");
      continue;
    }
    if (parts.length !== 4) {
      record(
        file,
        "bad-path-depth",
        `expected data/<language>/<library>/<version>/<file>.md (4 segments), got ${parts.length}`,
      );
      continue;
    }

    const versionKey = parts.slice(0, 3).join("/");
    if (!versionDirs.has(versionKey)) versionDirs.set(versionKey, new Set());
    versionDirs.get(versionKey).add(name);

    if (name === BLUEPRINT_FILE || name === ALL_CATEGORIES_FILE) {
      continue;
    }
    if (!CATEGORY_FILENAME.test(name)) {
      record(
        file,
        "unrecognized-filename",
        `not a category slug, ${BLUEPRINT_FILE}, or ${ALL_CATEGORIES_FILE}`,
      );
      continue;
    }

    let body = await readFile(file, "utf-8");
    if (fix) {
      const normalized = normalizeMarkdownWhitespace(body);
      if (normalized.fixCount > 0) {
        body = normalized.body;
        fixedCount += normalized.fixCount;
        await writeFile(file, body, "utf-8");
      }
    }

    categoryFileCount += 1;
    cardCount += checkCategoryFile(file, body);
  }

  for (const [versionKey, files] of versionDirs) {
    for (const required of [BLUEPRINT_FILE, ALL_CATEGORIES_FILE]) {
      if (!files.has(required)) {
        errors.push({
          file: `data/${versionKey}/${required}`,
          rule: "missing-required-file",
          detail: `version folder is missing ${required}`,
          line: null,
        });
      }
    }
  }

  errors.sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      (left.line ?? 0) - (right.line ?? 0) ||
      left.rule.localeCompare(right.rule),
  );

  if (fixedCount > 0) {
    console.log(`lint-cards: auto-fixed ${fixedCount} whitespace issue(s)`);
  }
  for (const error of errors) {
    const location = error.line ? `${error.file}:${error.line}` : error.file;
    console.error(`${location}: ${error.rule} — ${error.detail}`);
  }

  console.log(
    `lint-cards: ${cardCount} cards, ${categoryFileCount} category files, ${versionDirs.size} versions, ${errors.length} violation(s)`,
  );
  if (errors.length > 0) process.exit(1);
  console.log("lint-cards: OK");
}

main().catch((error) => {
  console.error("lint-cards: unexpected error", error);
  process.exit(1);
});
