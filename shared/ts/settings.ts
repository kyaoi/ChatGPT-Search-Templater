import { models, sharedSpec } from './spec.js';
import {
  DEFAULT_QUERY_TEMPLATE,
  DEFAULT_TEMPLATE_URL,
  hasPlaceholder,
} from './urlBuilder.js';

export type TemplateModelOption = (typeof models)[number];

export interface TemplateSettings {
  id: string;
  label: string;
  url: string;
  queryTemplate: string;
  enabled: boolean;
  hintsSearch: boolean;
  temporaryChat: boolean;
  model: TemplateModelOption;
  isDefault: boolean;
  customModel?: string;
}

type TemplateSource = Partial<TemplateSettings> & {
  default?: boolean;
};

export interface ExtensionSettings {
  templates: TemplateSettings[];
  hardLimit: number;
  parentMenuTitle: string;
}

export const DEFAULT_HARD_LIMIT = sharedSpec.defaultHardLimit;
export const DEFAULT_PARENT_MENU_TITLE = sharedSpec.defaultParentMenuTitle;

const TEMPLATE_MODEL_OPTIONS =
  sharedSpec.templateModelOptions as readonly TemplateModelOption[];

export function isTemplateModelOption(
  value: unknown,
): value is TemplateModelOption {
  return (
    typeof value === 'string' &&
    TEMPLATE_MODEL_OPTIONS.some((option) => option === value)
  );
}

const DEFAULT_TEMPLATE_BLUEPRINT = sharedSpec.defaultTemplates[0];
const BLUEPRINT_IS_DEFAULT =
  typeof DEFAULT_TEMPLATE_BLUEPRINT?.default === 'boolean'
    ? DEFAULT_TEMPLATE_BLUEPRINT.default
    : false;

const TEMPLATE_BLUEPRINT: Omit<TemplateSettings, 'id'> = {
  label: DEFAULT_TEMPLATE_BLUEPRINT?.label ?? '標準検索',
  url: DEFAULT_TEMPLATE_BLUEPRINT?.url ?? DEFAULT_TEMPLATE_URL,
  queryTemplate:
    DEFAULT_TEMPLATE_BLUEPRINT?.queryTemplate ?? DEFAULT_QUERY_TEMPLATE,
  enabled: DEFAULT_TEMPLATE_BLUEPRINT?.enabled ?? true,
  hintsSearch: DEFAULT_TEMPLATE_BLUEPRINT?.hintsSearch ?? false,
  temporaryChat: DEFAULT_TEMPLATE_BLUEPRINT?.temporaryChat ?? false,
  model: (DEFAULT_TEMPLATE_BLUEPRINT?.model ??
    models[0]) as TemplateModelOption,
  isDefault: BLUEPRINT_IS_DEFAULT,
  customModel: DEFAULT_TEMPLATE_BLUEPRINT?.customModel,
};

function createTemplateFallback(): TemplateSettings {
  const fallback: TemplateSettings = {
    id: generateTemplateId(),
    ...TEMPLATE_BLUEPRINT,
  };

  if (!fallback.customModel) {
    delete fallback.customModel;
  }

  return fallback;
}

function sanitizeTemplate(
  template: TemplateSource | undefined,
  fallback: TemplateSettings,
): TemplateSettings {
  const source = template ?? {};
  const labelCandidate =
    typeof source.label === 'string' ? source.label.trim() : '';
  const label = labelCandidate.length > 0 ? labelCandidate : fallback.label;

  const urlCandidate = typeof source.url === 'string' ? source.url.trim() : '';
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
        : (fallback.customModel ?? '')
      : undefined;

  const idCandidate =
    typeof source.id === 'string' && source.id.trim().length > 0
      ? source.id.trim()
      : fallback.id;

  const isDefault = (() => {
    if (typeof source.isDefault === 'boolean') {
      return source.isDefault;
    }
    if (typeof source.default === 'boolean') {
      return source.default;
    }
    return fallback.isDefault ?? false;
  })();

  const normalized: TemplateSettings = {
    id: idCandidate,
    label,
    url,
    queryTemplate,
    enabled,
    hintsSearch,
    temporaryChat,
    model,
    isDefault,
  };

  if (customModelValue && customModelValue.length > 0) {
    normalized.customModel = customModelValue;
  }

  return normalized;
}

export function generateTemplateId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `template-${crypto.randomUUID()}`;
  } else if (
    typeof crypto !== 'undefined' &&
    typeof crypto.getRandomValues === 'function'
  ) {
    // Fallback: generate a random 8-character hex string
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    const random = Array.from(array)
      .map((n) => n.toString(16).padStart(8, '0'))
      .join('');
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
  overrides?: TemplateSource,
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
    const overrideDefault =
      typeof overrides.isDefault === 'boolean'
        ? overrides.isDefault
        : typeof overrides.default === 'boolean'
          ? overrides.default
          : undefined;
    if (typeof overrideDefault === 'boolean') {
      fallback.isDefault = overrideDefault;
    }
  }

  return sanitizeTemplate(undefined, fallback);
}

function enforceDefaultTemplate(
  templates: TemplateSettings[],
): TemplateSettings[] {
  if (templates.length === 0) {
    return templates;
  }

  let defaultIndex = templates.findIndex(
    (template) => template.isDefault && template.enabled,
  );
  if (defaultIndex === -1) {
    defaultIndex = templates.findIndex((template) => template.isDefault);
  }
  if (defaultIndex === -1) {
    defaultIndex = templates.findIndex((template) => template.enabled);
  }
  if (defaultIndex === -1) {
    defaultIndex = 0;
  }

  return templates.map((template, index) => ({
    ...template,
    isDefault: index === defaultIndex,
  }));
}

const DEFAULT_TEMPLATE_LIST = sharedSpec.defaultTemplates.map((template) =>
  createTemplateDefaults({
    ...template,
    model: isTemplateModelOption(template.model)
      ? template.model
      : TEMPLATE_BLUEPRINT.model,
  }),
);

export const DEFAULT_TEMPLATES: TemplateSettings[] = enforceDefaultTemplate(
  DEFAULT_TEMPLATE_LIST,
);

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
  template: TemplateSource,
  fallbackId: string,
  index: number,
): TemplateSettings {
  const defaults =
    DEFAULT_TEMPLATES[index] ?? createTemplateDefaults({ id: fallbackId });
  return sanitizeTemplate(template, defaults);
}

function normalizeTemplates(
  templates: TemplateSource[] | undefined,
): TemplateSettings[] {
  if (!Array.isArray(templates) || templates.length === 0) {
    return DEFAULT_TEMPLATES.map((template) => ({ ...template }));
  }

  const seenIds = new Set<string>();

  const normalizedTemplates = templates.map((template, index) => {
    const fallback = DEFAULT_TEMPLATES[index] ?? createTemplateDefaults();
    const normalized = sanitizeTemplate(template, fallback);

    let id = normalized.id.trim();
    if (id.length === 0 || seenIds.has(id)) {
      const MAX_ID_ATTEMPTS = 1000;
      let attempts = 0;
      do {
        id = generateTemplateId();
        attempts++;
        if (attempts >= MAX_ID_ATTEMPTS) {
          throw new Error(
            'Failed to generate a unique template ID after 1000 attempts.',
          );
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

  return enforceDefaultTemplate(normalizedTemplates);
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

  const templates = normalizeTemplates(
    raw?.templates as TemplateSource[] | undefined,
  );

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
