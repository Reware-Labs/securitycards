/**
 * Flips <html data-theme> between "light" and "dark" and remembers the
 * choice in localStorage. The initial value is set by an inline script in
 * BaseLayout.astro's <head> — this only handles the click.
 */
const toggle = document.getElementById('theme-toggle') as HTMLButtonElement | null;

function applyTheme(next: 'light' | 'dark') {
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  toggle?.setAttribute('aria-label', next === 'dark' ? 'Use light theme' : 'Use dark theme');
  toggle?.setAttribute('title', next === 'dark' ? 'Use light theme' : 'Use dark theme');
}

const initialTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
toggle?.setAttribute('aria-label', initialTheme === 'dark' ? 'Use light theme' : 'Use dark theme');
toggle?.setAttribute('title', initialTheme === 'dark' ? 'Use light theme' : 'Use dark theme');

toggle?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
});
