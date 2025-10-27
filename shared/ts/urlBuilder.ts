import { sharedSpec } from './spec.js';

export const PLACEHOLDER_VARIANTS =
  sharedSpec.placeholders as readonly string[];

export const DEFAULT_TEMPLATE_URL = sharedSpec.defaultTemplateUrl;
export const DEFAULT_QUERY_TEMPLATE = sharedSpec.defaultQueryTemplate;

export type PlaceholderToken = (typeof PLACEHOLDER_VARIANTS)[number];

export interface TemplateRuntimeOptions {
  hintsSearch: boolean;
  temporaryChat: boolean;
  model?: string;
}

export interface BuildChatGPTUrlParams {
  templateUrl: string;
  queryTemplate: string;
  rawText: string;
  runtimeOptions: TemplateRuntimeOptions;
}

export interface BuildChatGPTUrlResult {
  url: string;
  query: string;
  encodedQuery: string;
}

function maskLiteralPlaceholders(template: string): {
  masked: string;
  restore: (value: string) => string;
} {
  const tokens: string[] = [];
  let masked = template;

  PLACEHOLDER_VARIANTS.forEach((placeholder, index) => {
    const inner = placeholder.slice(1, -1);
    const literalForm = `{{${inner}}}`;
    const token = `__PLACEHOLDER_LITERAL_${index}__`;
    tokens.push(token);
    masked = masked.replaceAll(literalForm, token);
  });

  return {
    masked,
    restore: (value: string) => {
      let restored = value;
      PLACEHOLDER_VARIANTS.forEach((placeholder, index) => {
        const token = `__PLACEHOLDER_LITERAL_${index}__`;
        restored = restored.replaceAll(token, placeholder);
      });
      return restored;
    },
  };
}

export function applyPlaceholders(template: string, replacement: string): string {
  const { masked, restore } = maskLiteralPlaceholders(template);

  const substituted = PLACEHOLDER_VARIANTS.reduce(
    (acc, placeholder) => acc.replaceAll(placeholder, replacement),
    masked,
  );

  return restore(substituted);
}

export function hasPlaceholder(value: string): boolean {
  return PLACEHOLDER_VARIANTS.some((placeholder) => {
    let searchStart = value.indexOf(placeholder);
    while (searchStart !== -1) {
      const previousChar = searchStart > 0 ? value[searchStart - 1] : undefined;
      const nextChar = value[searchStart + placeholder.length];
      const isEscaped = previousChar === '{' && nextChar === '}';
      if (!isEscaped) {
        return true;
      }
      searchStart = value.indexOf(placeholder, searchStart + placeholder.length);
    }
    return false;
  });
}

export function buildChatGPTUrl(
  params: BuildChatGPTUrlParams,
): BuildChatGPTUrlResult {
  const { templateUrl, queryTemplate, rawText, runtimeOptions } = params;

  const baseTemplate =
    templateUrl.trim().length > 0 ? templateUrl.trim() : DEFAULT_TEMPLATE_URL;
  const baseQueryTemplate =
    queryTemplate.trim().length > 0 ? queryTemplate : DEFAULT_QUERY_TEMPLATE;

  const preparedQuery = applyPlaceholders(baseQueryTemplate, rawText);
  const encodedQuery = encodeURIComponent(preparedQuery);

  const urlWithQuery = applyPlaceholders(baseTemplate, encodedQuery);

  let url: URL;
  try {
    url = new URL(urlWithQuery);
  } catch (_error) {
    url = new URL(urlWithQuery, 'https://chatgpt.com/');
  }

  if (runtimeOptions.hintsSearch) {
    url.searchParams.set('hints', 'search');
  }

  if (runtimeOptions.temporaryChat) {
    url.searchParams.set('temporary-chat', 'true');
  }

  if (runtimeOptions.model && runtimeOptions.model.trim().length > 0) {
    url.searchParams.set('model', runtimeOptions.model.trim());
  }

  return {
    url: url.toString(),
    query: preparedQuery,
    encodedQuery,
  };
}
