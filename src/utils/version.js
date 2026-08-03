/**
 * Preserve the complete version-folder label for display and tracking while
 * making it easier to read. No semantic-version format is required.
 */
export function formatVersionLabel(versionSlug) {
  return versionSlug.replace(/-/g, ".");
}

/**
 * Keep catalog ordering deterministic without validating or parsing versions.
 * Numeric comparison handles common labels such as v2-9-0 and v2-10-0 while
 * still accepting arbitrary upstream prefixes.
 */
const versionCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

export function compareVersionSlugs(left, right) {
  return versionCollator.compare(left, right);
}
