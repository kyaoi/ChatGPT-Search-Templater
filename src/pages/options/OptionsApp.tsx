import type { FormEvent, JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  collectTemplateWarnings,
  createTemplateDefaults,
  DEFAULT_SETTINGS,
  normalizeSettings,
} from '../../lib/settings.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import {
  ensureTemplateSelection,
  getSelectedTemplate,
  settingsAdapter,
  updateTemplateDraft,
} from './draftAdapter.js';
import type { SettingsDraft, TemplateDraft, TemplateUpdater } from './types.js';
import { ActionBar } from './components/ActionBar.js';
import { GeneralSettingsSection } from './components/GeneralSettingsSection.js';
import { OptionsHero } from './components/OptionsHero.js';
import { TemplateEditor } from './components/TemplateEditor.js';
import { TemplateList } from './components/TemplateList.js';

export function OptionsApp(): JSX.Element {
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void loadSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }
        const nextDraft = settingsAdapter.toDraft(settings);
        setDraft(nextDraft);
        setSelectedTemplateId(ensureTemplateSelection(nextDraft, null));
        setDirty(false);
        setStatusMessage('');
        setLoadingError(null);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setLoadingError('設定の読み込みに失敗しました。');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setSelectedTemplateId((current) => ensureTemplateSelection(draft, current));
  }, [draft]);

  const selectedTemplate = useMemo<TemplateDraft | null>(
    () => getSelectedTemplate(draft, selectedTemplateId),
    [draft, selectedTemplateId],
  );

  const markDirty = useCallback(() => {
    setDirty(true);
    setStatusMessage('');
  }, []);

  const handleTemplateChange = useCallback(
    (templateId: string, updater: TemplateUpdater) => {
      setDraft((current) => updateTemplateDraft(current, templateId, updater));
      markDirty();
    },
    [markDirty],
  );

  const handleTemplateAdd = useCallback(() => {
    const newTemplate = createTemplateDefaults();
    const draftTemplate: TemplateDraft = {
      ...newTemplate,
      customModel: newTemplate.customModel ?? '',
    };
    let updated = false;
    setDraft((current) => {
      if (!current) {
        return current;
      }
      updated = true;
      return {
        ...current,
        templates: [...current.templates, draftTemplate],
      };
    });
    if (updated) {
      setSelectedTemplateId(draftTemplate.id);
      markDirty();
    }
  }, [markDirty]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setStatusMessage('');
  }, []);

  const handleFieldChange = useCallback(
    (key: 'hardLimit' | 'parentMenuTitle', value: string) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              [key]: value,
            }
          : current,
      );
      markDirty();
    },
    [markDirty],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!draft) {
        return;
      }

      const normalized = settingsAdapter.fromDraft(draft);
      const hasPlaceholderWarning = normalized.templates.some(
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

      setIsSaving(true);
      try {
        await saveSettings(normalized);
        const nextDraft = settingsAdapter.toDraft(normalized);
        setDraft(nextDraft);
        setSelectedTemplateId((currentId) =>
          ensureTemplateSelection(nextDraft, currentId),
        );
        setDirty(false);
        setStatusMessage('保存しました。');
        setLoadingError(null);
      } catch (error) {
        console.error(error);
        window.alert('保存に失敗しました。もう一度お試しください。');
      } finally {
        setIsSaving(false);
      }
    },
    [draft],
  );

  const handleReset = useCallback(async () => {
    if (!draft) {
      return;
    }
    const confirmed = window.confirm(
      '初期設定に戻しますか？保存されているテンプレートは上書きされます。',
    );
    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    try {
      const normalizedDefaults = normalizeSettings(DEFAULT_SETTINGS);
      await saveSettings(normalizedDefaults);
      const defaultDraft = settingsAdapter.toDraft(normalizedDefaults);
      setDraft(defaultDraft);
      setSelectedTemplateId(ensureTemplateSelection(defaultDraft, null));
      setDirty(false);
      setStatusMessage('初期設定に戻しました。');
      setLoadingError(null);
    } catch (error) {
      console.error(error);
      window.alert('初期設定へのリセットに失敗しました。');
    } finally {
      setIsResetting(false);
    }
  }, [draft]);

  const statusText =
    loadingError ?? (dirty ? '未保存の変更があります。' : statusMessage);

  return (
    <div className="min-h-screen bg-[radial-gradient(160%_120%_at_10%_20%,rgba(56,189,248,0.12),transparent),_radial-gradient(100%_140%_at_90%_0%,rgba(129,140,248,0.16),transparent),_linear-gradient(180deg,#f5f7ff,#ffffff)] text-[#334155]">
      <main className="mx-auto w-full max-w-[1040px] px-5 pt-16 pb-20 sm:px-6 lg:px-8">
        <OptionsHero />
        {draft ? (
          <form id="settingsForm" className="mt-10" onSubmit={handleSubmit}>
            <div className="grid gap-7 xl:grid-cols-[minmax(260px,320px)_1fr]">
              <TemplateList
                templates={draft.templates}
                selectedTemplateId={selectedTemplateId}
                onSelect={handleTemplateSelect}
                onAdd={handleTemplateAdd}
              />

              <div className="flex min-w-0 flex-col gap-7">
                <GeneralSettingsSection
                  hardLimit={draft.hardLimit}
                  parentMenuTitle={draft.parentMenuTitle}
                  onHardLimitChange={(value) =>
                    handleFieldChange('hardLimit', value)
                  }
                  onParentMenuTitleChange={(value) =>
                    handleFieldChange('parentMenuTitle', value)
                  }
                />

                <section className="rounded-[28px]">
                  {selectedTemplate ? (
                    <TemplateEditor
                      template={selectedTemplate}
                      onChange={(updater) =>
                        handleTemplateChange(selectedTemplate.id, updater)
                      }
                    />
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[rgba(129,140,248,0.6)] bg-[rgba(255,255,255,0.5)] p-9 text-center text-[14px] text-[#475569]">
                      テンプレートを左のリストから選択してください。
                    </div>
                  )}
                </section>

                <ActionBar
                  isLoading={isLoading}
                  statusText={statusText}
                  isSaving={isSaving}
                  isResetting={isResetting}
                  onReset={() => {
                    void handleReset();
                  }}
                />
              </div>
            </div>
          </form>
        ) : (
          <section className="mt-10 flex flex-col gap-3 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-6 text-[#475569]">
            <p>
              {isLoading
                ? '設定を読み込み中…'
                : '設定を読み込めませんでした。ページを再読み込みしてください。'}
            </p>
            {loadingError && (
              <p className="text-xs font-medium text-rose-600">
                {loadingError}
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
