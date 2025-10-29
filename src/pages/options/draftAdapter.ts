import {
  collectTemplateWarnings,
  type ExtensionSettings,
  normalizeSettings,
  resolveModelId,
  type TemplateSettings,
} from '@shared/settings.js';
import { buildChatGPTUrl } from '@shared/urlBuilder.js';
import type { SettingsDraft, TemplateDraft, TemplateUpdater } from './types.js';

const SAMPLE_TEXT = '日本の大規模言語モデル事情';

export const settingsAdapter = {
  toDraft(settings: ExtensionSettings): SettingsDraft {
    return {
      hardLimit: String(settings.hardLimit),
      parentMenuTitle: settings.parentMenuTitle,
      templates: settings.templates.map((template) => ({
        ...template,
        customModel: template.customModel ?? '',
      })),
    };
  },
  fromDraft(draft: SettingsDraft): ExtensionSettings {
    const parsedHardLimit = Number.parseInt(draft.hardLimit, 10);
    const sanitizedTemplates: TemplateSettings[] = draft.templates.map(
      (template) => ({
        ...template,
        isDefault: Boolean(template.isDefault),
        label: template.label.trim(),
        url: template.url.trim(),
        queryTemplate: template.queryTemplate,
        customModel: template.customModel.trim()
          ? template.customModel.trim()
          : undefined,
      }),
    );

    const base: Partial<ExtensionSettings> = {
      parentMenuTitle: draft.parentMenuTitle,
      templates: sanitizedTemplates,
    };

    if (Number.isFinite(parsedHardLimit)) {
      base.hardLimit = parsedHardLimit;
    }

    return normalizeSettings(base);
  },
} as const;

export function ensureTemplateSelection(
  draft: SettingsDraft | null,
  selectedTemplateId: string | null,
): string | null {
  if (!draft) {
    return null;
  }
  const hasSelected = draft.templates.some(
    (template) => template.id === selectedTemplateId,
  );
  if (hasSelected) {
    return selectedTemplateId;
  }
  const enabledTemplates = draft.templates.filter(
    (template) => template.enabled,
  );
  const defaultTemplate =
    enabledTemplates.find((template) => template.isDefault) ??
    draft.templates.find((template) => template.isDefault);
  if (defaultTemplate) {
    return defaultTemplate.id;
  }
  if (enabledTemplates[0]) {
    return enabledTemplates[0].id;
  }
  return draft.templates[0]?.id ?? null;
}

export function updateTemplateDraft(
  draft: SettingsDraft | null,
  templateId: string,
  updater: TemplateUpdater,
): SettingsDraft | null {
  if (!draft) {
    return draft;
  }
  const nextTemplates = draft.templates.map((template) =>
    template.id === templateId ? updater(template) : template,
  );
  return {
    ...draft,
    templates: nextTemplates,
  };
}

export function getSelectedTemplate(
  draft: SettingsDraft | null,
  selectedTemplateId: string | null,
): TemplateDraft | null {
  if (!draft) {
    return null;
  }
  return (
    draft.templates.find((template) => template.id === selectedTemplateId) ??
    null
  );
}

export function templatePreview(template: TemplateDraft) {
  const normalized: TemplateSettings = {
    ...template,
    customModel: template.customModel.trim()
      ? template.customModel.trim()
      : undefined,
  };

  const preview = buildChatGPTUrl({
    templateUrl: template.url,
    queryTemplate: template.queryTemplate,
    rawText: SAMPLE_TEXT,
    runtimeOptions: {
      hintsSearch: template.hintsSearch,
      temporaryChat: template.temporaryChat,
      model: resolveModelId(normalized),
    },
  });

  return {
    query: preview.query,
    url: preview.url,
    warnings: collectTemplateWarnings(normalized),
  };
}
