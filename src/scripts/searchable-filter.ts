export interface SearchableFilterController {
  root: HTMLElement;
  value: HTMLInputElement;
  toggle: HTMLButtonElement;
  close: (returnFocus?: boolean) => void;
  focus: () => void;
  hasValue: (value: string) => boolean;
  selectedLabel: () => string;
  setValue: (value: string) => void;
}

interface SearchableFilterOptions {
  onChange?: (controller: SearchableFilterController) => void;
}

const controllers: SearchableFilterController[] = [];
let outsideListenersBound = false;

export function createSearchableFilter(
  rootId: string,
  { onChange }: SearchableFilterOptions = {},
): SearchableFilterController | null {
  const root = document.getElementById(rootId);
  const value = root?.querySelector<HTMLInputElement>('[data-filter-value]');
  const toggle = root?.querySelector<HTMLButtonElement>('[data-filter-toggle]');
  const label = root?.querySelector<HTMLElement>('[data-filter-label]');
  const popover = root?.querySelector<HTMLElement>('[data-filter-popover]');
  const search = root?.querySelector<HTMLInputElement>('[data-filter-search]');
  const empty = root?.querySelector<HTMLElement>('[data-filter-empty]');
  const options = Array.from(
    root?.querySelectorAll<HTMLButtonElement>('.filter-combobox-option') ?? [],
  );

  if (!root || !value || !toggle || !label || !popover || !search) return null;
  const rootElement = root;
  const valueInput = value;
  const toggleButton = toggle;
  const labelElement = label;
  const popoverElement = popover;
  const searchInput = search;

  function visibleOptions(): HTMLButtonElement[] {
    return options.filter(option => !option.hidden);
  }

  function filterOptions(query: string): void {
    const normalizedQuery = query.trim().toLowerCase();
    let visible = 0;
    for (const option of options) {
      const searchable = option.dataset.search ?? option.dataset.label ?? '';
      const matches = searchable.toLowerCase().includes(normalizedQuery);
      option.hidden = !matches;
      if (matches) visible += 1;
    }
    if (empty) empty.hidden = visible > 0;
  }

  function close(returnFocus = false): void {
    popoverElement.hidden = true;
    toggleButton.setAttribute('aria-expanded', 'false');
    searchInput.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggleButton.focus();
  }

  function open(): void {
    for (const controller of controllers) {
      if (controller.root !== rootElement) controller.close();
    }
    popoverElement.hidden = false;
    toggleButton.setAttribute('aria-expanded', 'true');
    searchInput.setAttribute('aria-expanded', 'true');
    searchInput.value = '';
    filterOptions('');
    requestAnimationFrame(() => searchInput.focus());
  }

  function setValue(nextValue: string): void {
    const selected = options.find(option => option.dataset.value === nextValue) ?? options[0];
    valueInput.value = selected?.dataset.value ?? '';
    labelElement.textContent = selected?.dataset.label ?? '';
    for (const option of options) {
      option.setAttribute('aria-selected', String(option === selected));
    }
  }

  const controller: SearchableFilterController = {
    root: rootElement,
    value: valueInput,
    toggle: toggleButton,
    close,
    focus: () => toggleButton.focus(),
    hasValue: candidate => options.some(option => option.dataset.value === candidate),
    selectedLabel: () => options.find(option => option.dataset.value === valueInput.value)?.dataset.label ?? '',
    setValue,
  };

  toggleButton.addEventListener('click', () => {
    if (popoverElement.hidden) open();
    else close(true);
  });
  searchInput.addEventListener('input', () => filterOptions(searchInput.value));
  searchInput.addEventListener('keydown', event => {
    const visible = visibleOptions();
    if (event.key === 'ArrowDown' && visible.length > 0) {
      event.preventDefault();
      visible[0]?.focus();
    } else if (event.key === 'ArrowUp' && visible.length > 0) {
      event.preventDefault();
      visible[visible.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Enter' && visible.length === 1) {
      event.preventDefault();
      visible[0]?.click();
    }
  });

  for (const option of options) {
    option.addEventListener('click', () => {
      setValue(option.dataset.value ?? '');
      close(true);
      onChange?.(controller);
    });
    option.addEventListener('keydown', event => {
      const visible = visibleOptions();
      const index = visible.indexOf(option);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        visible[(index + 1) % visible.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        visible[(index - 1 + visible.length) % visible.length]?.focus();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
      } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        searchInput.focus();
        searchInput.value += event.key;
        filterOptions(searchInput.value);
      }
    });
  }

  controllers.push(controller);
  if (!outsideListenersBound) {
    document.addEventListener('pointerdown', event => {
      for (const item of controllers) {
        if (!item.root.contains(event.target as Node)) item.close();
      }
    });
    document.addEventListener('focusin', event => {
      for (const item of controllers) {
        if (!item.root.contains(event.target as Node)) item.close();
      }
    });
    outsideListenersBound = true;
  }

  return controller;
}
