import { capture } from './analytics';
import { createSearchableFilter } from './searchable-filter';

const output = document.querySelector<HTMLElement>('[data-prompt-output]');
const copy = document.querySelector<HTMLButtonElement>('[data-prompt-copy]');

if (output && copy) {
  const generalPrompt = output.dataset.generalPrompt ?? output.textContent ?? '';

  const updatePrompt = (label: string, url: string) => {
    const prompt = label && url
      ? `Use the Security Cards skill for this task with ${label}. Confirm that the project uses this version, then start with ${url} and choose more focused category cards when they fit the task. Apply every relevant Secure rule, verify the finished work with appropriate tests or checks, and include links to the Security Cards you used.`
      : generalPrompt;

    output.textContent = prompt;
    copy.dataset.content = prompt;
    const copyLabel = label
      ? `Copy Security Cards prompt for ${label}`
      : 'Copy general Security Cards prompt';
    copy.dataset.defaultLabel = copyLabel;
    copy.setAttribute('aria-label', copyLabel);
  };

  const filter = createSearchableFilter('integration-library-combobox', {
    onChange: controller => {
      const label = controller.value.value ? controller.selectedLabel() : '';
      updatePrompt(label, controller.value.value);
      capture('integration_library_selected', {
        library: label || 'automatic',
      });
    },
  });

  updatePrompt(filter?.value.value ? filter.selectedLabel() : '', filter?.value.value ?? '');
}
