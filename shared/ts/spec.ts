import rawSpec from '../spec.json';

export interface SharedTemplateSpec {
  readonly placeholders: readonly string[];
  readonly defaultTemplateUrl: string;
  readonly defaultQueryTemplate: string;
  readonly templateModelOptions: readonly string[];
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
    readonly model: string;
    readonly customModel?: string;
  }[];
}

export const sharedSpec = rawSpec as SharedTemplateSpec;
