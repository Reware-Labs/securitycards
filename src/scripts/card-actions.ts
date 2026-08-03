import { capture } from './analytics';

/**
 * Copy and Download actions for card panels.
 *
 * The library page renders many CardActions instances on a single page, so we
 * bind by CLASS (not id) and read the raw markdown from each button's data-*.
 * Reads the raw markdown from data-* attributes on the buttons.
 */

const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
     viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <polyline points="20 6 9 17 4 12"/>
</svg>`;

const ICON_ERROR = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none"
     viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
  <circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 17h.01"/>
</svg>`;

// ── Copy to clipboard ────────────────────────────────────────
// Each button gets its own reset timer so panels don't interfere.
const copyTimers = new WeakMap<HTMLButtonElement, ReturnType<typeof setTimeout>>();

document.querySelectorAll<HTMLButtonElement>('.copy-btn').forEach((btn) => {
  const defaultHtml = btn.innerHTML;
  const hasVisibleLabel = Boolean(btn.querySelector('.icon-btn-label'));
  btn.addEventListener('click', async () => {
    const content = btn.dataset.content ?? '';
    try {
      await navigator.clipboard.writeText(content);
      const panel = btn.closest<HTMLElement>('[data-panel]')?.dataset.panel;
      capture('content_copied', {
        card: panel,
        content_type: btn.classList.contains('int-copy') ? 'integration_url' : panel ? 'security_card' : 'code_snippet',
      });

      btn.innerHTML = `${ICON_CHECK}${hasVisibleLabel ? '<span class="icon-btn-label">Copied</span>' : ''}`;
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', 'Markdown copied');
      btn.disabled = true;

      const existing = copyTimers.get(btn);
      if (existing) clearTimeout(existing);
      copyTimers.set(
        btn,
        setTimeout(() => {
          btn.innerHTML = defaultHtml;
          btn.classList.remove('is-copied');
          btn.setAttribute('aria-label', btn.dataset.defaultLabel ?? 'Copy to clipboard');
          btn.disabled = false;
          copyTimers.delete(btn);
        }, 2000),
      );
    } catch {
      btn.innerHTML = `${ICON_ERROR}${hasVisibleLabel ? '<span class="icon-btn-label">Copy failed</span>' : ''}`;
      btn.classList.add('is-error');
      btn.setAttribute('aria-label', 'Copy failed. Select and copy the text manually.');
      setTimeout(() => {
        btn.innerHTML = defaultHtml;
        btn.classList.remove('is-error');
        btn.setAttribute('aria-label', btn.dataset.defaultLabel ?? 'Copy to clipboard');
      }, 2500);
    }
  });
});

// ── Download as .md file ─────────────────────────────────────
document.querySelectorAll<HTMLButtonElement>('.download-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const content  = btn.dataset.content  ?? '';
    const filename = btn.dataset.filename ?? 'card.md';

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url  = URL.createObjectURL(blob);

    const anchor    = document.createElement('a');
    anchor.href     = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
    capture('content_downloaded', {
      card: btn.closest<HTMLElement>('[data-panel]')?.dataset.panel,
      content_type: 'security_card',
      file_type: 'markdown',
    });
  });
});
