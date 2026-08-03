import { capture } from './analytics';

/**
 * ⌘K command palette — client logic.
 *
 * Opens on Cmd/Ctrl+K or the header search button. The search index
 * (/search-index.json) is fetched lazily on first open and cached at module
 * scope. Scoring is hand-rolled (substring / word-boundary prefix / subsequence,
 * weighted title > inner-titles > library > category > language) so there's no
 * runtime dependency. Results are grouped by library and capped at 20.
 */

interface RawEntry { t: string; l: string; g: string; v: string; c: string; u: string; k: string[]; }
interface Entry extends RawEntry { _t: string; _l: string; _g: string; _c: string; _k: string[]; }

const dialogEl = document.getElementById('command-palette') as HTMLDialogElement | null;
const inputEl  = document.getElementById('cmdk-input')  as HTMLInputElement | null;
const listEl   = document.getElementById('cmdk-list')   as HTMLUListElement | null;
const emptyEl  = document.getElementById('cmdk-empty')  as HTMLElement | null;
const statusEl = document.getElementById('cmdk-status') as HTMLElement | null;

if (dialogEl && inputEl && listEl && emptyEl && statusEl) {
  // Non-null aliases so nested closures below don't need repeated guards.
  const dialog = dialogEl, input = inputEl, list = listEl, empty = emptyEl, status = statusEl;
  // ── Lazy index load (cached module-scope promise) ──────────
  let indexPromise: Promise<Entry[]> | null = null;
  function loadIndex(): Promise<Entry[]> {
    if (!indexPromise) {
      indexPromise = fetch('/search-index.json')
        .then(r => r.json() as Promise<RawEntry[]>)
        .then(raw => raw.map(e => ({
          ...e,
          _t: e.t.toLowerCase(),
          _l: e.l.toLowerCase(),
          _g: e.g.toLowerCase(),
          _c: e.c.toLowerCase(),
          _k: e.k.map(k => k.toLowerCase()),
        })))
        .catch(() => { indexPromise = null; throw new Error('Search index unavailable'); });
    }
    return indexPromise;
  }

  // ── Scoring ────────────────────────────────────────────────
  function isSubsequence(term: string, str: string): boolean {
    let i = 0;
    for (const ch of str) { if (ch === term[i]) i++; if (i === term.length) return true; }
    return i === term.length;
  }
  function fieldTermScore(field: string, term: string): number {
    const idx = field.indexOf(term);
    if (idx === 0) return 160;                       // prefix of the field
    if (idx > 0) {
      const prev = field[idx - 1];
      if (prev === ' ' || prev === '-' || prev === '/' || prev === '.') return 140; // word-boundary prefix
      return 100;                                    // substring
    }
    return isSubsequence(term, field) ? 20 : 0;      // fuzzy fallback
  }
  function scoreEntry(e: Entry, terms: string[]): number {
    let total = 0;
    for (const term of terms) {
      let best = 1.0 * fieldTermScore(e._t, term);
      for (const k of e._k) best = Math.max(best, 0.95 * fieldTermScore(k, term));
      best = Math.max(best, 0.9 * fieldTermScore(e._l, term));
      best = Math.max(best, 0.6 * fieldTermScore(e._c, term));
      best = Math.max(best, 0.4 * fieldTermScore(e._g, term));
      if (best === 0) return -1;                     // every term must hit something (AND)
      total += best;
    }
    return total;
  }
  // Best title to show — an inner ### card title can outrank the card's own title.
  function pickTitle(e: Entry, terms: string[]): string {
    const candidates = [e._t, ...e._k];
    let bestIdx = 0, bestScore = -1;
    candidates.forEach((low, i) => {
      let s = 0; for (const term of terms) s += fieldTermScore(low, term);
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    });
    if (bestScore <= 0) return e.t;
    return bestIdx === 0 ? e.t : e.k[bestIdx - 1];
  }

  // ── Rendering ──────────────────────────────────────────────
  let options: HTMLElement[] = [];   // flat list of selectable <li role=option>
  let activeIndex = -1;

  function libraryList(entries: Entry[]) {
    // Empty query → one row per library/version.
    const seen = new Set<string>();
    const rows: { title: string; sub: string; url: string }[] = [];
    for (const e of entries) {
      const key = e.l + e.v + e.g;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ title: `${e.l} ${e.v}`, sub: e.g, url: e.u.split('#')[0] });
    }
    return rows;
  }

  function render(query: string, entries: Entry[]) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    list.innerHTML = '';
    options = [];
    activeIndex = -1;

    if (terms.length === 0) {
      // Library index view.
      const rows = libraryList(entries);
      empty.hidden = rows.length > 0;
      const groupLi = document.createElement('li');
      groupLi.className = 'cmdk-group';
      groupLi.setAttribute('role', 'presentation');
      groupLi.textContent = 'Libraries';
      list.appendChild(groupLi);
      rows.forEach(r => appendOption(r.title, r.sub, r.url));
      setActive(0);
      return;
    }

    // Score + sort + cap.
    const scored = entries
      .map(e => ({ e, score: scoreEntry(e, terms) }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    empty.hidden = scored.length > 0;

    // Group by library (preserving score order of first appearance).
    const groups = new Map<string, { e: Entry }[]>();
    for (const s of scored) {
      const key = `${s.e.l} ${s.e.v} / ${s.e.g}`;
      const arr = groups.get(key) ?? [];
      arr.push(s);
      groups.set(key, arr);
    }
    for (const [groupLabel, arr] of groups) {
      const groupLi = document.createElement('li');
      groupLi.className = 'cmdk-group';
      groupLi.setAttribute('role', 'presentation');
      groupLi.textContent = groupLabel;
      list.appendChild(groupLi);
      for (const { e } of arr) {
        appendOption(pickTitle(e, terms), e.c, e.u);
      }
    }
    setActive(0);
  }

  function appendOption(title: string, sub: string, url: string) {
    const li = document.createElement('li');
    li.className = 'cmdk-option';
    li.setAttribute('role', 'option');
    li.id = `cmdk-opt-${options.length}`;
    li.dataset.url = url;
    li.innerHTML = `<span class="cmdk-opt-title"></span><span class="cmdk-opt-sub"></span>`;
    li.querySelector('.cmdk-opt-title')!.textContent = title;
    li.querySelector('.cmdk-opt-sub')!.textContent = sub;
    li.addEventListener('click', () => go(url));
    li.addEventListener('mousemove', () => setActive(options.indexOf(li)));
    list.appendChild(li);
    options.push(li);
  }

  function setActive(i: number) {
    if (options.length === 0) { activeIndex = -1; input.removeAttribute('aria-activedescendant'); return; }
    activeIndex = (i + options.length) % options.length;
    options.forEach((o, idx) => o.setAttribute('aria-selected', String(idx === activeIndex)));
    const active = options[activeIndex];
    input.setAttribute('aria-activedescendant', active.id);
    active.scrollIntoView({ block: 'nearest' });
  }

  function go(url: string) {
    capture('command_palette_result_selected', {
      result_type: url.includes('#') ? 'security_card' : 'library',
    });
    close();
    // Same-page hash change (library.ts listens for hashchange); otherwise a
    // full navigation. Setting href handles both.
    window.location.href = url;
  }

  // ── Open / close ───────────────────────────────────────────
  let returnFocusTo: HTMLElement | null = null;
  async function open(source: 'keyboard' | 'button') {
    if (dialog.open) return;
    capture('command_palette_opened', { entry_method: source });
    returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    input.value = '';
    input.focus();
    list.replaceChildren();
    empty.hidden = true;
    status.hidden = false;
    status.textContent = 'Loading search index…';
    try {
      const entries = await loadIndex();
      status.hidden = true;
      render('', entries);
    } catch {
      status.textContent = 'Search is unavailable. Close this dialog and browse libraries instead.';
    }
  }
  function close() {
    if (dialog.open) dialog.close();
  }
  dialog.addEventListener('close', () => {
    returnFocusTo?.focus();
    returnFocusTo = null;
  });

  // ── Debounced input ────────────────────────────────────────
  let debounce: ReturnType<typeof setTimeout>;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      try {
        const entries = await loadIndex();
        status.hidden = true;
        render(input.value.trim(), entries);
      } catch {
        list.replaceChildren();
        empty.hidden = true;
        status.hidden = false;
        status.textContent = 'Search is unavailable. Close this dialog and browse libraries instead.';
      }
    }, 80);
  });

  // ── Keyboard ───────────────────────────────────────────────
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(activeIndex + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(activeIndex - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const active = options[activeIndex];
      if (active?.dataset.url) go(active.dataset.url);
    }
  });

  // Native <dialog> already closes on Esc and backdrop-Esc; also close on
  // clicking the backdrop (outside .cmdk-inner).
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  // Global open shortcut + header trigger.
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog.open ? close() : open('keyboard');
    }
  });
  document.querySelectorAll('[data-command-open]').forEach(btn => {
    btn.addEventListener('click', () => open('button'));
  });
}
