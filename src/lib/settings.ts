import {
  DEFAULT_QUERY_TEMPLATE,
  DEFAULT_TEMPLATE_URL,
  hasPlaceholder,
} from './urlBuilder.js';

export type TemplateModelOption =
  | 'gpt-4o'
  | 'o3'
  | 'gpt-5'
  | 'gpt-5-thinking'
  | 'custom';

export interface TemplateSettings {
  id: string;
  label: string;
  url: string;
  queryTemplate: string;
  enabled: boolean;
  hintsSearch: boolean;
  temporaryChat: boolean;
  model: TemplateModelOption;
  customModel?: string;
}

export interface ExtensionSettings {
  templates: TemplateSettings[];
  hardLimit: number;
  parentMenuTitle: string;
}

const TEMPLATE_IDS = ['template-1', 'template-2'] as const;
export const MAX_TEMPLATES = TEMPLATE_IDS.length;
export const DEFAULT_HARD_LIMIT = 3000;
export const DEFAULT_PARENT_MENU_TITLE = 'ChatGPTで検索';

export const DEFAULT_TEMPLATES: TemplateSettings[] = [
  {
    id: TEMPLATE_IDS[0],
    label: '標準検索',
    url: DEFAULT_TEMPLATE_URL,
    queryTemplate: DEFAULT_QUERY_TEMPLATE,
    enabled: true,
    hintsSearch: false,
    temporaryChat: false,
    model: 'gpt-5',
  },
  {
    id: TEMPLATE_IDS[1],
    label: 'Search + Temporary',
    url: DEFAULT_TEMPLATE_URL,
    queryTemplate: DEFAULT_QUERY_TEMPLATE,
    enabled: false,
    hintsSearch: true,
    temporaryChat: true,
    model: 'gpt-5-thinking',
  },
];

export const DEFAULT_SETTINGS: ExtensionSettings = {
  templates: DEFAULT_TEMPLATES.map((template) => ({ ...template })),
  hardLimit: DEFAULT_HARD_LIMIT,
  parentMenuTitle: DEFAULT_PARENT_MENU_TITLE,
};

export function getTemplateById(
  templates: TemplateSettings[],
  id: string,
): TemplateSettings | undefined {
  return templates.find((template) => template.id === id);
}

export function ensureTemplateCount(
  templates: TemplateSettings[],
): TemplateSettings[] {
  const normalized: TemplateSettings[] = [];

  TEMPLATE_IDS.forEach((templateId, index) => {
    const source = templates[index];
    if (source) {
      normalized.push(enrichTemplate(source, templateId, index));
      return;
    }

    const fallback = DEFAULT_TEMPLATES[index] ?? DEFAULT_TEMPLATES[0];
    if (!fallback) {
      throw new Error('default template is not defined');
    }

    normalized.push({ ...fallback });
  });

  return normalized;
}

export function enrichTemplate(
  template: Partial<TemplateSettings>,
  fallbackId: string,
  index: number,
): TemplateSettings {
  const defaults = DEFAULT_TEMPLATES[index] ?? DEFAULT_TEMPLATES[0];
  if (!defaults) {
    throw new Error('default template is not defined');
  }

  return {
    id: template.id ?? fallbackId,
    label:
      template.label && template.label.trim().length > 0
        ? template.label
        : defaults.label,
    url: template.url ?? defaults.url,
    queryTemplate: template.queryTemplate ?? defaults.queryTemplate,
    enabled: template.enabled ?? defaults.enabled,
    hintsSearch: template.hintsSearch ?? defaults.hintsSearch,
    temporaryChat: template.temporaryChat ?? defaults.temporaryChat,
    model: template.model ?? defaults.model,
    customModel: template.customModel ?? defaults.customModel,
  };
}

export function normalizeSettings(
  raw: Partial<ExtensionSettings> | undefined,
): ExtensionSettings {
  const rawHardLimit =
    typeof raw?.hardLimit === 'number' && Number.isFinite(raw.hardLimit)
      ? raw.hardLimit
      : DEFAULT_HARD_LIMIT;
  const hardLimit = Math.max(100, rawHardLimit);
  const parentMenuTitle =
    raw?.parentMenuTitle && raw.parentMenuTitle.trim().length > 0
      ? raw.parentMenuTitle.trim()
      : DEFAULT_PARENT_MENU_TITLE;

  const templates = ensureTemplateCount(raw?.templates ?? DEFAULT_TEMPLATES);

  return {
    hardLimit,
    parentMenuTitle,
    templates,
  };
}

export function resolveModelId(template: TemplateSettings): string | undefined {
  if (template.model === 'custom') {
    return template.customModel?.trim().length
      ? template.customModel.trim()
      : undefined;
  }
  return template.model;
}

export function collectTemplateWarnings(template: TemplateSettings): string[] {
  const warnings: string[] = [];

  const hasEffectivePlaceholder =
    hasPlaceholder(template.url) || hasPlaceholder(template.queryTemplate);

  if (!hasEffectivePlaceholder) {
    warnings.push(
      'プレースホルダ（{TEXT} または {選択した文字列}）がテンプレートに含まれていません。',
    );
  }

  return warnings;
}
