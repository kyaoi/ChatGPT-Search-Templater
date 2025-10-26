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

export const DEFAULT_HARD_LIMIT = 3000;
export const DEFAULT_PARENT_MENU_TITLE = 'ChatGPTで検索';

const TEMPLATE_MODEL_OPTIONS: readonly TemplateModelOption[] = [
  'gpt-4o',
  'o3',
  'gpt-5',
  'gpt-5-thinking',
  'custom',
];

export function isTemplateModelOption(value: unknown): value is TemplateModelOption {
  return (
    typeof value === 'string' &&
    TEMPLATE_MODEL_OPTIONS.some((option) => option === value)
  );
}

const TEMPLATE_BLUEPRINT: Omit<TemplateSettings, 'id'> = {
  label: '標準検索',
  url: DEFAULT_TEMPLATE_URL,
  queryTemplate: DEFAULT_QUERY_TEMPLATE,
  enabled: true,
  hintsSearch: false,
  temporaryChat: false,
  model: 'gpt-5',
};

function createTemplateFallback(): TemplateSettings {
  return {
    id: generateTemplateId(),
    ...TEMPLATE_BLUEPRINT,
  };
}

function sanitizeTemplate(
  template: Partial<TemplateSettings> | undefined,
  fallback: TemplateSettings,
): TemplateSettings {
  const source = template ?? {};
  const labelCandidate =
    typeof source.label === 'string' ? source.label.trim() : '';
  const label = labelCandidate.length > 0 ? labelCandidate : fallback.label;

  const urlCandidate =
    typeof source.url === 'string' ? source.url.trim() : '';
  const url = urlCandidate.length > 0 ? urlCandidate : fallback.url;

  const queryTemplate =
    typeof source.queryTemplate === 'string'
      ? source.queryTemplate
      : fallback.queryTemplate;

  const enabled =
    typeof source.enabled === 'boolean' ? source.enabled : fallback.enabled;

  const hintsSearch =
    typeof source.hintsSearch === 'boolean'
      ? source.hintsSearch
      : fallback.hintsSearch;

  const temporaryChat =
    typeof source.temporaryChat === 'boolean'
      ? source.temporaryChat
      : fallback.temporaryChat;

  const model = isTemplateModelOption(source.model)
    ? source.model
    : fallback.model;

  const customModelValue =
    model === 'custom'
      ? typeof source.customModel === 'string'
        ? source.customModel.trim()
        : fallback.customModel ?? ''
      : undefined;

  const idCandidate =
    typeof source.id === 'string' && source.id.trim().length > 0
      ? source.id.trim()
      : fallback.id;

  const normalized: TemplateSettings = {
    id: idCandidate,
    label,
    url,
    queryTemplate,
    enabled,
    hintsSearch,
    temporaryChat,
    model,
  };

  if (customModelValue && customModelValue.length > 0) {
    normalized.customModel = customModelValue;
  }

  return normalized;
}

export function generateTemplateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `template-${crypto.randomUUID()}`;
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    // Fallback: generate a random 8-character hex string
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const random = Array.from(array).map((n) => n.toString(16).padStart(8, '0')).join('');
    const timestamp = Date.now().toString(36);
    return `template-${timestamp}-${random}`;
  } else {
    // Last resort: use Math.random (not recommended)
    const random = Math.random().toString(36).slice(2, 10);
    const timestamp = Date.now().toString(36);
    return `template-${timestamp}-${random}`;
  }
}

export function createTemplateDefaults(
  overrides?: Partial<TemplateSettings>,
): TemplateSettings {
  const fallback = createTemplateFallback();

  if (overrides) {
    if (typeof overrides.id === 'string' && overrides.id.trim().length > 0) {
      fallback.id = overrides.id.trim();
    }
    if (typeof overrides.label === 'string') {
      fallback.label = overrides.label;
    }
    if (typeof overrides.url === 'string') {
      fallback.url = overrides.url;
    }
    if (typeof overrides.queryTemplate === 'string') {
      fallback.queryTemplate = overrides.queryTemplate;
    }
    if (typeof overrides.enabled === 'boolean') {
      fallback.enabled = overrides.enabled;
    }
    if (typeof overrides.hintsSearch === 'boolean') {
      fallback.hintsSearch = overrides.hintsSearch;
    }
    if (typeof overrides.temporaryChat === 'boolean') {
      fallback.temporaryChat = overrides.temporaryChat;
    }
    if (isTemplateModelOption(overrides.model)) {
      fallback.model = overrides.model;
    }
    if (typeof overrides.customModel === 'string') {
      const trimmed = overrides.customModel.trim();
      if (trimmed.length > 0) {
        fallback.customModel = trimmed;
      } else {
        delete fallback.customModel;
      }
    }
  }

  return sanitizeTemplate(undefined, fallback);
}

export const DEFAULT_TEMPLATES: TemplateSettings[] = [
  createTemplateDefaults({ id: 'template-1' }),
  createTemplateDefaults({
    id: 'template-2',
    label: 'Search + Temporary',
    enabled: false,
    hintsSearch: true,
    temporaryChat: true,
    model: 'gpt-5-thinking',
  }),
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

export function enrichTemplate(
  template: Partial<TemplateSettings>,
  fallbackId: string,
  index: number,
): TemplateSettings {
  const defaults =
    DEFAULT_TEMPLATES[index] ?? createTemplateDefaults({ id: fallbackId });
  return sanitizeTemplate(template, defaults);
}

function normalizeTemplates(
  templates: Partial<TemplateSettings>[] | undefined,
): TemplateSettings[] {
  if (!Array.isArray(templates) || templates.length === 0) {
    return DEFAULT_TEMPLATES.map((template) => ({ ...template }));
  }

  const seenIds = new Set<string>();

  return templates.map((template, index) => {
    const fallback =
      DEFAULT_TEMPLATES[index] ?? createTemplateDefaults();
    const normalized = sanitizeTemplate(template, fallback);

    let id = normalized.id.trim();
    if (id.length === 0 || seenIds.has(id)) {
      const MAX_ID_ATTEMPTS = 1000;
      let attempts = 0;
      do {
        id = generateTemplateId();
        attempts++;
        if (attempts >= MAX_ID_ATTEMPTS) {
          throw new Error('Failed to generate a unique template ID after 1000 attempts.');
        }
      } while (seenIds.has(id));
    }

    seenIds.add(id);

    const withId: TemplateSettings = {
      ...normalized,
      id,
    };

    if (normalized.model === 'custom') {
      const customModel =
        typeof template?.customModel === 'string'
          ? template.customModel.trim()
          : normalized.customModel;
      if (customModel && customModel.length > 0) {
        withId.customModel = customModel;
      }
    }

    return withId;
  });
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

  const templates = normalizeTemplates(raw?.templates);

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
