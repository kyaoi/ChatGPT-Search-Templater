export const models = [
  'gpt-5.1',
  'gpt-5.1-thinking',
  'gpt-5',
  'gpt-5-thinking',
  'custom',
] as const;

export type Model = (typeof models)[number];

export interface SharedTemplateSpec {
  readonly placeholders: readonly string[];
  readonly defaultTemplateUrl: string;
  readonly defaultQueryTemplate: string;
  readonly templateModelOptions: readonly Model[];
  readonly defaultHardLimit: number;
  readonly defaultParentMenuTitle: string;
  readonly defaultTemplates: readonly {
    readonly id: string;
    readonly label: string;
    readonly url: string;
    readonly queryTemplate: string;
    readonly enabled: boolean;
    readonly hintsSearch: boolean;
    readonly temporaryChat: boolean;
    readonly model: Model;
    readonly customModel?: string;
    readonly default?: boolean;
  }[];
}

const spec: SharedTemplateSpec = {
  placeholders: ['{選択した文字列}', '{TEXT}'],
  defaultTemplateUrl: 'https://chatgpt.com/?prompt={TEXT}',
  defaultQueryTemplate: '{TEXT}',
  templateModelOptions: models,
  defaultHardLimit: 3000,
  defaultParentMenuTitle: 'ChatGPTで検索',
  defaultTemplates: [
    {
      id: 'template-1',
      label: '標準検索',
      url: 'https://chatgpt.com/?prompt={TEXT}',
      queryTemplate: '{TEXT}',
      default: true,
      enabled: true,
      hintsSearch: false,
      temporaryChat: false,
      model: models[0],
    },
    {
      id: 'template-2',
      label: 'Search + Temporary',
      url: 'https://chatgpt.com/?prompt={TEXT}',
      queryTemplate: '{TEXT}',
      enabled: false,
      hintsSearch: true,
      temporaryChat: true,
      model: models[1],
    },
  ],
};

export const sharedSpec = spec;
