import type { TemplateSettings } from '../../lib/settings.js';

export type TemplateDraft = Omit<TemplateSettings, 'customModel'> & {
  customModel: string;
};

export interface SettingsDraft {
  hardLimit: string;
  parentMenuTitle: string;
  templates: TemplateDraft[];
}

export type TemplateUpdater = (current: TemplateDraft) => TemplateDraft;
