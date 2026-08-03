import { capture } from './analytics';

type Persona = "human" | "agent";

const KEY = "integrationPersona";
const PERSONAS: Persona[] = ["human", "agent"];

const tablist = document.querySelector<HTMLElement>("[data-persona-tabs]");

function isPersona(v: string | null): v is Persona {
  return v === "human" || v === "agent";
}

if (tablist) {
  const tabs = PERSONAS.map((p) =>
    tablist.querySelector<HTMLButtonElement>(`[data-persona="${p}"]`),
  );
  const panels = PERSONAS.map((p) =>
    document.querySelector<HTMLElement>(`[data-persona-panel="${p}"]`),
  );

  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Choose your audience");
  PERSONAS.forEach((p, i) => {
    const tab = tabs[i];
    const panel = panels[i];
    if (tab) {
      tab.setAttribute("role", "tab");
      tab.id = `persona-tab-${p}`;
      tab.setAttribute("aria-controls", `persona-panel-${p}`);
    }
    if (panel) {
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `persona-tab-${p}`);
      panel.setAttribute("tabindex", "0");
    }
  });

  function activate(
    persona: Persona,
    { updateHash = true, focusTab = false } = {},
  ) {
    PERSONAS.forEach((p, i) => {
      const selected = p === persona;
      const tab = tabs[i];
      const panel = panels[i];
      if (tab) {
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focusTab) tab.focus();
      }
      if (panel) panel.hidden = !selected;
    });
    try {
      localStorage.setItem(KEY, persona);
    } catch {}
    if (updateHash) history.replaceState(null, "", `#${persona}`);
  }

  PERSONAS.forEach((p, i) => {
    tabs[i]?.addEventListener("click", () => {
      activate(p);
      capture('integration_persona_selected', { persona: p });
    });
  });

  tablist.addEventListener("keydown", (e) => {
    const current = PERSONAS.findIndex(
      (p) =>
        tabs[PERSONAS.indexOf(p)]?.getAttribute("aria-selected") === "true",
    );
    let next = current;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (current - 1 + PERSONAS.length) % PERSONAS.length;
    else if (e.key === "ArrowRight" || e.key === "ArrowDown")
      next = (current + 1) % PERSONAS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = PERSONAS.length - 1;
    else return;
    e.preventDefault();
    activate(PERSONAS[next], { focusTab: true });
  });

  window.addEventListener("hashchange", () => {
    const p = location.hash.slice(1);
    if (isPersona(p)) activate(p, { updateHash: false });
  });

  const hashPersona = location.hash.slice(1);
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch {}
  const initial: Persona = isPersona(hashPersona)
    ? hashPersona
    : isPersona(stored)
      ? stored
      : "human";
  activate(initial, { updateHash: isPersona(hashPersona) });

  tablist.hidden = false;
}
