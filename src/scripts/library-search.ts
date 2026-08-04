import { capture } from "./analytics";
import {
  createSearchableFilter,
  type SearchableFilterController,
} from "./searchable-filter";

const input = document.getElementById(
  "library-search-input",
) as HTMLInputElement | null;
const category = document.getElementById(
  "category-filter",
) as HTMLInputElement | null;
const language = document.getElementById(
  "language-filter",
) as HTMLInputElement | null;
const noResults = document.getElementById("no-results") as HTMLElement | null;
// Library result count temporarily hidden; retain for easy restoration.
// const resultCount = document.getElementById(
//   "library-result-count",
// ) as HTMLElement | null;
const activeFilters = document.getElementById(
  "active-filters",
) as HTMLElement | null;
const clearButton = document.getElementById(
  "clear-filters",
) as HTMLButtonElement | null;
const cards = Array.from(
  document.querySelectorAll<HTMLElement>(".library-card"),
);
const grid = document.getElementById("library-grid");
const pagination = document.getElementById("catalog-pagination");
const paginationStatus = document.getElementById("catalog-pagination-status");
const previousPageButton = document.getElementById(
  "catalog-pagination-previous",
) as HTMLButtonElement | null;
const nextPageButton = document.getElementById(
  "catalog-pagination-next",
) as HTMLButtonElement | null;
const viewButtons = Array.from(
  document.querySelectorAll<HTMLButtonElement>("[data-library-view]"),
);

type LibraryView = "grid" | "list";
const PAGE_SIZE = 20;
let currentPage = 1;

const searchableFilters: SearchableFilterController[] = [
  createSearchableFilter("category-filter-combobox", {
    onChange: () => render("catalog_filter_changed", true),
  }),
  createSearchableFilter("language-filter-combobox", {
    onChange: () => render("catalog_filter_changed", true),
  }),
].filter((filter): filter is SearchableFilterController => filter !== null);
const categoryFilter = searchableFilters.find(
  (filter) => filter.value === category,
);
const languageFilter = searchableFilters.find(
  (filter) => filter.value === language,
);

function setView(view: LibraryView, persist = true): void {
  grid?.setAttribute("data-view", view);
  for (const button of viewButtons) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.libraryView === view),
    );
  }
  if (persist) {
    try {
      localStorage.setItem("library-view", view);
    } catch {
      /* Browsing still works without persistence. */
    }
  }
}

function updateUrl(
  query: string,
  categoryValue: string,
  languageValue: string,
  page: number,
): void {
  const url = new URL(window.location.href);
  const values = {
    q: query,
    category: categoryValue,
    language: languageValue,
    page: page > 1 ? String(page) : "",
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function addFilterChip(
  label: string,
  control: HTMLInputElement,
  clear?: () => void,
  restoreFocus?: () => void,
): void {
  if (!activeFilters) return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "filter-chip";
  button.textContent = `${label} ×`;
  button.setAttribute("aria-label", `Remove filter ${label}`);
  button.addEventListener("click", () => {
    if (clear) clear();
    else control.value = "";
    render(undefined, true);
    if (restoreFocus) restoreFocus();
    else control.focus();
  });
  activeFilters.appendChild(button);
}

function render(
  eventName?: "catalog_searched" | "catalog_filter_changed",
  resetPage = false,
): void {
  const query = input?.value.trim().toLowerCase() ?? "";
  const categoryValue = category?.value ?? "";
  const languageValue = language?.value ?? "";
  const matches: HTMLElement[] = [];

  for (const card of cards) {
    const haystack = card.dataset.keywords ?? "";
    const cardCategories = (card.dataset.categories ?? "").split(" ");
    const cardLanguage = card.dataset.language ?? "";
    const match =
      (!query || haystack.includes(query)) &&
      (!categoryValue || cardCategories.includes(categoryValue)) &&
      (!languageValue || cardLanguage === languageValue);
    if (match) matches.push(card);
  }

  if (resetPage) currentPage = 1;
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  currentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageCards = new Set(matches.slice(pageStart, pageStart + PAGE_SIZE));
  for (const card of cards) card.hidden = !pageCards.has(card);

  const hasFilters = Boolean(query || categoryValue || languageValue);
  if (noResults) noResults.hidden = matches.length > 0;
  // Library result count temporarily hidden; retain for easy restoration.
  // if (resultCount) {
  //   resultCount.textContent = `${matches.length} ${matches.length === 1 ? "library" : "libraries"}${hasFilters ? " found" : ""}`;
  // }
  if (pagination) pagination.hidden = matches.length === 0 || totalPages === 1;
  if (paginationStatus)
    paginationStatus.textContent = `Page ${currentPage} of ${totalPages}`;
  if (previousPageButton) previousPageButton.disabled = currentPage === 1;
  if (nextPageButton) nextPageButton.disabled = currentPage === totalPages;
  if (clearButton) clearButton.hidden = !hasFilters;
  if (activeFilters) {
    activeFilters.replaceChildren();
    if (query && input) addFilterChip(`Search: ${input.value.trim()}`, input);
    if (categoryValue && category)
      addFilterChip(
        categoryFilter?.selectedLabel() ?? "",
        category,
        () => categoryFilter?.setValue(""),
        () => categoryFilter?.focus(),
      );
    if (languageValue && language)
      addFilterChip(
        languageFilter?.selectedLabel() ?? "",
        language,
        () => languageFilter?.setValue(""),
        () => languageFilter?.focus(),
      );
  }
  updateUrl(
    input?.value.trim() ?? "",
    categoryValue,
    languageValue,
    currentPage,
  );
  if (eventName) {
    capture(eventName, {
      has_query: Boolean(query),
      category: categoryValue || null,
      language: languageValue || null,
      result_count: matches.length,
      result_count_bucket:
        matches.length === 0
          ? "0"
          : matches.length <= 5
            ? "1-5"
            : matches.length <= 20
              ? "6-20"
              : "21+",
    });
  }
}

function restoreFromUrl(): void {
  const params = new URLSearchParams(window.location.search);
  if (input) input.value = params.get("q") ?? "";
  const categoryValue = params.get("category") ?? "";
  if (categoryFilter?.hasValue(categoryValue))
    categoryFilter.setValue(categoryValue);
  const languageValue = params.get("language") ?? "";
  if (languageFilter?.hasValue(languageValue))
    languageFilter.setValue(languageValue);
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? requestedPage
    : 1;
}

let inputTimer: ReturnType<typeof setTimeout>;
input?.addEventListener("input", () => {
  clearTimeout(inputTimer);
  inputTimer = setTimeout(() => render("catalog_searched", true), 300);
});
clearButton?.addEventListener("click", () => {
  if (input) input.value = "";
  categoryFilter?.setValue("");
  languageFilter?.setValue("");
  render("catalog_filter_changed", true);
  input?.focus();
});

function changePage(offset: number): void {
  currentPage += offset;
  render();
  const resultsTitle = document.getElementById("library-results-title");
  resultsTitle?.focus({ preventScroll: true });
  resultsTitle?.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
}

previousPageButton?.addEventListener("click", () => changePage(-1));
nextPageButton?.addEventListener("click", () => changePage(1));
for (const button of viewButtons) {
  button.addEventListener("click", () => {
    const view = button.dataset.libraryView === "list" ? "list" : "grid";
    setView(view);
    capture("catalog_view_changed", { view });
  });
}

restoreFromUrl();
let initialView: LibraryView = "grid";
try {
  initialView =
    localStorage.getItem("library-view") === "list" ? "list" : "grid";
} catch {
  /* Use the default. */
}
setView(initialView, false);
render();
