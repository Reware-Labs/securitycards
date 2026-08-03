import { capture } from "./analytics";

const items = Array.from(
  document.querySelectorAll<HTMLButtonElement>(".lib-nav-item"),
);
const panels = Array.from(document.querySelectorAll<HTMLElement>(".lib-panel"));
const search = document.getElementById("lib-search") as HTMLInputElement | null;
const searchEmpty = document.getElementById(
  "lib-search-empty",
) as HTMLElement | null;

const navToggle = document.getElementById(
  "lib-nav-toggle",
) as HTMLButtonElement | null;
const navCollapsible = document.getElementById(
  "lib-nav-collapsible",
) as HTMLElement | null;
const navToggleLabel = document.getElementById(
  "lib-nav-toggle-label",
) as HTMLElement | null;

/** Show the panel with the given target, hide the rest, sync the list + hash. */
function select(
  target: string,
  updateHash = true,
  shouldScroll = true,
  source?: string,
): void {
  let matched = false;

  for (const panel of panels) {
    const isMatch = panel.dataset.panel === target;
    panel.hidden = !isMatch;
    if (isMatch) matched = true;
  }

  if (!matched) return;

  for (const item of items) {
    const isActive = item.dataset.target === target;
    item.classList.toggle("is-active", isActive);
    if (isActive) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  }

  const activeItem = items.find((i) => i.dataset.target === target);
  if (navToggleLabel && activeItem) {
    navToggleLabel.textContent =
      activeItem.querySelector(".lib-nav-label")?.textContent ?? "";
  }
  navToggle?.setAttribute("aria-expanded", "false");
  navCollapsible?.classList.add("is-collapsed");

  if (updateHash) {
    history.replaceState(null, "", `#${target}`);
  }

  if (shouldScroll) {
    const panel = panels.find((p) => p.dataset.panel === target);
    panel?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }
  if (source)
    capture("security_card_viewed", {
      card: target,
      navigation_source: source,
    });
}

// ── List clicks ──────────────────────────────────────────────
for (const item of items) {
  item.addEventListener("click", () => {
    const target = item.dataset.target;
    if (target) select(target, true, true, "sidebar");
  });
}

document.addEventListener("click", (e) => {
  const el = e.target instanceof Element ? e.target : null;

  const navBtn = el?.closest<HTMLElement>(".card-nav-btn");
  if (navBtn?.dataset.target) {
    select(
      navBtn.dataset.target,
      true,
      true,
      navBtn.classList.contains("card-nav-prev") ? "previous" : "next",
    );
    return;
  }

  const tocLink = el?.closest<HTMLElement>(".card-toc-link");
  const slug = tocLink?.dataset.scrollTo;
  if (slug) {
    const activePanel = panels.find((p) => !p.hidden);
    const heading = activePanel?.querySelector("#" + CSS.escape(slug));
    heading?.scrollIntoView({ behavior: "smooth", block: "start" });
    capture("card_navigation_used", {
      navigation_source: "table_of_contents",
      heading: slug,
    });
  }
});

// ── Mobile accordion toggle ───────────────────────────────────
navToggle?.addEventListener("click", () => {
  const collapsed = navCollapsible?.classList.toggle("is-collapsed");
  navToggle.setAttribute("aria-expanded", String(!collapsed));
  capture("card_navigation_used", {
    navigation_source: "mobile_menu",
    expanded: !collapsed,
  });
});

// ── Left-list search filter ──────────────────────────────────
let cardFilterTimer: ReturnType<typeof setTimeout>;
search?.addEventListener("input", () => {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  for (const item of items) {
    const text = item.textContent?.toLowerCase() ?? "";
    const li = item.closest("li");
    const matches = !query || text.includes(query);
    if (li) li.hidden = !matches;
    if (matches) visible += 1;
  }
  if (searchEmpty) searchEmpty.hidden = visible > 0;
  clearTimeout(cardFilterTimer);
  cardFilterTimer = setTimeout(() => {
    capture("card_filter_changed", {
      has_query: Boolean(query),
      result_count: visible,
      result_count_bucket: visible === 0 ? "0" : visible <= 5 ? "1-5" : "6+",
    });
  }, 300);
});

window.addEventListener("hashchange", () => {
  const target = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (target && panels.some((p) => p.dataset.panel === target)) {
    select(target, false);
  }
});

// ── Initial selection: URL hash, else first item ─────────────
const initial = decodeURIComponent(location.hash.replace(/^#/, ""));
if (initial && panels.some((p) => p.dataset.panel === initial)) {
  select(initial, false, false);
} else if (items[0]?.dataset.target) {
  select(items[0].dataset.target, false, false);
}
