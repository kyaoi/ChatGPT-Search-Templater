import { buildChatGPTUrl } from './lib/urlBuilder.js';
import {
  DEFAULT_SETTINGS,
  ExtensionSettings,
  TemplateSettings,
  collectTemplateWarnings,
  normalizeSettings,
  resolveModelId,
} from './lib/settings.js';
import { loadSettings, saveSettings } from './lib/storage.js';

interface TemplateCardView {
  id: string;
  root: HTMLElement;
  fields: {
    enabled: HTMLInputElement;
    label: HTMLInputElement;
    url: HTMLInputElement;
    queryTemplate: HTMLTextAreaElement;
    hintsSearch: HTMLInputElement;
    temporaryChat: HTMLInputElement;
    model: HTMLSelectElement;
    customModel: HTMLInputElement;
  };
  customModelRow: HTMLElement;
  queryPreview: HTMLElement;
  preview: HTMLElement;
  warning: HTMLElement;
}

const SAMPLE_TEXT = '日本の大規模言語モデル事情';

const cards: TemplateCardView[] = [];

let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;

async function restoreSettings(): Promise<void> {
  currentSettings = await loadSettings();
  renderForm(currentSettings);
}

function findCard(templateId: string): TemplateCardView | undefined {
  return cards.find((card) => card.id === templateId);
}

function templateFromCard(card: TemplateCardView): TemplateSettings {
  return {
    id: card.id,
    label: card.fields.label.value.trim(),
    url: card.fields.url.value.trim(),
    queryTemplate: card.fields.queryTemplate.value,
    enabled: card.fields.enabled.checked,
    hintsSearch: card.fields.hintsSearch.checked,
    temporaryChat: card.fields.temporaryChat.checked,
    model: card.fields.model.value as TemplateSettings['model'],
    customModel: card.fields.customModel.value.trim() || undefined,
  };
}

function updateCardPreview(card: TemplateCardView): void {
  const template = templateFromCard(card);
  const result = buildChatGPTUrl({
    templateUrl: template.url,
    queryTemplate: template.queryTemplate,
    rawText: SAMPLE_TEXT,
    runtimeOptions: {
      hintsSearch: template.hintsSearch,
      temporaryChat: template.temporaryChat,
      model: resolveModelId(template),
    },
  });

  card.preview.textContent = result.url;
  card.queryPreview.textContent = result.query;

  const warnings = collectTemplateWarnings(template);
  card.warning.textContent = warnings.join(' ') ?? '';
}

function toggleCustomModelRow(card: TemplateCardView): void {
  const shouldShow = card.fields.model.value === 'custom';
  card.customModelRow.style.display = shouldShow ? 'flex' : 'none';
}

function renderForm(settings: ExtensionSettings): void {
  const form = document.querySelector<HTMLFormElement>('#settingsForm');
  const hardLimitInput = document.querySelector<HTMLInputElement>('#hardLimit');
  const parentMenuTitleInput = document.querySelector<HTMLInputElement>('#parentMenuTitle');

  if (!form || !hardLimitInput || !parentMenuTitleInput) {
    return;
  }

  hardLimitInput.value = String(settings.hardLimit);
  parentMenuTitleInput.value = settings.parentMenuTitle;

  settings.templates.forEach((template) => {
    const card = findCard(template.id);
    if (!card) {
      return;
    }

    card.fields.enabled.checked = template.enabled;
    card.fields.label.value = template.label;
    card.fields.url.value = template.url;
    card.fields.queryTemplate.value = template.queryTemplate;
    card.fields.hintsSearch.checked = template.hintsSearch;
    card.fields.temporaryChat.checked = template.temporaryChat;
    card.fields.model.value = template.model;
    card.fields.customModel.value = template.customModel ?? '';

    toggleCustomModelRow(card);
    updateCardPreview(card);
  });
}

function getFormSettings(): ExtensionSettings {
  const hardLimitValue = Number.parseInt(
    document.querySelector<HTMLInputElement>('#hardLimit')?.value ?? String(DEFAULT_SETTINGS.hardLimit),
    10,
  );
  const hardLimit = Number.isFinite(hardLimitValue) ? hardLimitValue : DEFAULT_SETTINGS.hardLimit;

  const parentMenuTitle = document
    .querySelector<HTMLInputElement>('#parentMenuTitle')
    ?.value.trim() || DEFAULT_SETTINGS.parentMenuTitle;

  const templates = cards.map((card) => templateFromCard(card));

  return normalizeSettings({
    hardLimit,
    parentMenuTitle,
    templates,
  });
}

async function handleSubmit(event: Event): Promise<void> {
  event.preventDefault();

  const saveButton = document.querySelector<HTMLButtonElement>('#saveButton');
  const statusText = document.querySelector<HTMLSpanElement>('#statusText');

  saveButton?.setAttribute('disabled', 'true');
  if (statusText) {
    statusText.textContent = '';
  }

  try {
    const draftSettings = getFormSettings();
    const hasPlaceholderWarning = draftSettings.templates.some(
      (template) => collectTemplateWarnings(template).length > 0,
    );

    if (hasPlaceholderWarning) {
      const proceed = window.confirm(
        'プレースホルダを含まないテンプレートがあります。このまま保存してもよろしいですか？',
      );
      if (!proceed) {
        return;
      }
    }

    await saveSettings(draftSettings);
    currentSettings = draftSettings;

    draftSettings.templates.forEach((template) => {
      const card = findCard(template.id);
      if (card) {
        updateCardPreview(card);
      }
    });

    if (statusText) {
      statusText.textContent = '保存しました。';
    }
  } catch (error) {
    window.alert('保存に失敗しました。もう一度お試しください。');
    console.error(error);
  } finally {
    saveButton?.removeAttribute('disabled');
  }
}

async function handleReset(): Promise<void> {
  const confirmed = window.confirm('初期設定に戻しますか？保存されているテンプレートは上書きされます。');
  if (!confirmed) {
    return;
  }

  const defaults = normalizeSettings(DEFAULT_SETTINGS);

  await saveSettings(defaults);
  currentSettings = defaults;
  renderForm(currentSettings);

  currentSettings.templates.forEach((template) => {
    const card = findCard(template.id);
    if (card) {
      updateCardPreview(card);
    }
  });

  const statusText = document.querySelector<HTMLSpanElement>('#statusText');
  if (statusText) {
    statusText.textContent = '初期設定に戻しました。';
  }
}

function setupCardEvents(card: TemplateCardView): void {
  card.fields.model.addEventListener('change', () => {
    toggleCustomModelRow(card);
    updateCardPreview(card);
  });

  [
    card.fields.enabled,
    card.fields.label,
    card.fields.url,
    card.fields.queryTemplate,
    card.fields.hintsSearch,
    card.fields.temporaryChat,
    card.fields.customModel,
  ].forEach((input) => {
    input.addEventListener('input', () => updateCardPreview(card));
    input.addEventListener('change', () => updateCardPreview(card));
  });
}

function initializeCards(): void {
  const cardElements = document.querySelectorAll<HTMLElement>('.template-card');
  cardElements.forEach((cardElement) => {
    const templateId = cardElement.dataset.templateId;
    if (!templateId) {
      return;
    }

    const enabled = cardElement.querySelector<HTMLInputElement>('input[data-field="enabled"]');
    const label = cardElement.querySelector<HTMLInputElement>('input[data-field="label"]');
    const url = cardElement.querySelector<HTMLInputElement>('input[data-field="url"]');
    const queryTemplate = cardElement.querySelector<HTMLTextAreaElement>('textarea[data-field="queryTemplate"]');
    const hintsSearch = cardElement.querySelector<HTMLInputElement>('input[data-field="hintsSearch"]');
    const temporaryChat = cardElement.querySelector<HTMLInputElement>('input[data-field="temporaryChat"]');
    const model = cardElement.querySelector<HTMLSelectElement>('select[data-field="model"]');
    const customModelRow = cardElement.querySelector<HTMLElement>('[data-role="custom-model"]');
    const customModel = cardElement.querySelector<HTMLInputElement>('input[data-field="customModel"]');
    const queryPreview = cardElement.querySelector<HTMLElement>('[data-role="query-preview"]');
    const preview = cardElement.querySelector<HTMLElement>('[data-role="preview"]');
    const warning = cardElement.querySelector<HTMLElement>('[data-role="warning"]');

    if (
      !enabled ||
      !label ||
      !url ||
      !queryTemplate ||
      !hintsSearch ||
      !temporaryChat ||
      !model ||
      !customModelRow ||
      !customModel ||
      !queryPreview ||
      !preview ||
      !warning
    ) {
      return;
    }

    const card: TemplateCardView = {
      id: templateId,
      root: cardElement,
      fields: {
        enabled,
        label,
        url,
        queryTemplate,
        hintsSearch,
        temporaryChat,
        model,
        customModel,
      },
      customModelRow,
      queryPreview,
      preview,
      warning,
    };

    cards.push(card);
    setupCardEvents(card);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  initializeCards();

  const form = document.querySelector<HTMLFormElement>('#settingsForm');
  form?.addEventListener('submit', (event) => {
    void handleSubmit(event);
  });

  const resetButton = document.querySelector<HTMLButtonElement>('#resetButton');
  resetButton?.addEventListener('click', () => {
    void handleReset();
  });

  await restoreSettings();
});
