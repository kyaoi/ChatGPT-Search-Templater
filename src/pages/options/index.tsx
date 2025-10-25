import type { JSX } from 'react';
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import {
  collectTemplateWarnings,
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  normalizeSettings,
  resolveModelId,
  type TemplateModelOption,
  type TemplateSettings,
} from '../../lib/settings.js';
import { loadSettings, saveSettings } from '../../lib/storage.js';
import { buildChatGPTUrl } from '../../lib/urlBuilder.js';
const SAMPLE_TEXT = '日本の大規模言語モデル事情';

type TemplateDraft = Omit<TemplateSettings, 'customModel'> & {
  customModel: string;
};

interface SettingsDraft {
  hardLimit: string;
  parentMenuTitle: string;
  templates: TemplateDraft[];
}

function toDraft(settings: ExtensionSettings): SettingsDraft {
  return {
    hardLimit: String(settings.hardLimit),
    parentMenuTitle: settings.parentMenuTitle,
    templates: settings.templates.map((template) => ({
      ...template,
      customModel: template.customModel ?? '',
    })),
  };
}

function fromDraft(draft: SettingsDraft): ExtensionSettings {
  const parsedHardLimit = Number.parseInt(draft.hardLimit, 10);
  const sanitizedTemplates: TemplateSettings[] = draft.templates.map(
    (template) => ({
      ...template,
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
}

interface TemplateEditorProps {
  template: TemplateDraft;
  onChange: (updater: (current: TemplateDraft) => TemplateDraft) => void;
}

function TemplateEditor({
  template,
  onChange,
}: TemplateEditorProps): JSX.Element {
  const normalizedTemplate = useMemo<TemplateSettings>(
    () => ({
      ...template,
      customModel: template.customModel.trim()
        ? template.customModel.trim()
        : undefined,
    }),
    [template],
  );

  const preview = useMemo(
    () =>
      buildChatGPTUrl({
        templateUrl: template.url,
        queryTemplate: template.queryTemplate,
        rawText: SAMPLE_TEXT,
        runtimeOptions: {
          hintsSearch: template.hintsSearch,
          temporaryChat: template.temporaryChat,
          model: resolveModelId(normalizedTemplate),
        },
      }),
    [
      normalizedTemplate,
      template.queryTemplate,
      template.temporaryChat,
      template.hintsSearch,
      template.url,
    ],
  );

  const warnings = useMemo(
    () => collectTemplateWarnings(normalizedTemplate),
    [normalizedTemplate],
  );

  const handleCheckboxChange = useCallback(
    (key: 'enabled' | 'hintsSearch' | 'temporaryChat') =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        onChange((current) => ({
          ...current,
          [key]: checked,
        }));
      },
    [onChange],
  );

  const showCustomModel = template.model === 'custom';

  return (
    <section
      className="flex flex-col gap-6 rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,245,255,0.8))] p-7 shadow-[0_30px_60px_-38px_rgba(30,41,59,0.4)]"
      data-template-id={template.id}
    >
      <header className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[12px] uppercase tracking-[0.3em] text-[#475569]">
            テンプレート詳細
          </p>
          <h3 className="mt-1.5 text-[1.4rem] font-semibold text-[#1e293b]">
            {template.label || '未命名テンプレート'}
          </h3>
        </div>
        <label
          className="inline-flex items-center gap-[10px] text-sm text-[#334155]"
        >
          <input
            type="checkbox"
            data-field="enabled"
            className="h-4 w-4 accent-primary"
            checked={template.enabled}
            onChange={handleCheckboxChange('enabled')}
          />
          <span className="font-semibold text-[#334155]">有効</span>
        </label>
      </header>

      <div className="flex flex-col gap-[18px]">
        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">
            メニュー表示名
          </span>
          <input
            type="text"
            data-field="label"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="メニュー表示名"
            value={template.label}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                label: event.target.value,
              }))
            }
          />
          <small className="text-[12px] text-[#475569]">
            コンテキストメニューに表示されます。
          </small>
        </label>

        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">
            テンプレートURL
          </span>
          <input
            type="text"
            data-field="url"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="https://chatgpt.com/?q={TEXT}"
            value={template.url}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                url: event.target.value,
              }))
            }
          />
        </label>

        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">
            検索内容テンプレート
          </span>
          <textarea
            data-field="queryTemplate"
            className="min-h-32 w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={'以下の文章を日本語に直してください。\n\n{TEXT}'}
            value={template.queryTemplate}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                queryTemplate: event.target.value,
              }))
            }
          />
          <small className="text-[12px] text-[#475569]">
            {`{TEXT} / {選択した文字列} が選択テキストに置き換わります。リテラル {TEXT} を表示したい場合は {{TEXT}} と入力してください。`}
          </small>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="inline-flex items-center gap-3 text-sm text-[#334155]">
          <input
            type="checkbox"
            data-field="hintsSearch"
            className="h-4 w-4 accent-primary"
            checked={template.hintsSearch}
            onChange={handleCheckboxChange('hintsSearch')}
          />
          <span>Searchヒント（hints=search）</span>
        </label>
        <label className="inline-flex items-center gap-3 text-sm text-[#334155]">
          <input
            type="checkbox"
            data-field="temporaryChat"
            className="h-4 w-4 accent-primary"
            checked={template.temporaryChat}
            onChange={handleCheckboxChange('temporaryChat')}
          />
          <span>一時チャット（temporary-chat=true）</span>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">モデル</span>
          <select
            data-field="model"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            value={template.model}
            onChange={(event) => {
              const value = event.target.value as TemplateModelOption;
              onChange((current) => ({
                ...current,
                model: value,
              }));
            }}
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="o3">o3</option>
            <option value="gpt-5">gpt-5</option>
            <option value="custom">カスタム</option>
          </select>
        </label>
        <label
          className={`flex flex-col gap-[10px] ${
            showCustomModel ? '' : 'hidden'
          }`}
          data-role="custom-model"
        >
          <span className="text-sm font-medium text-[#334155]">カスタムモデル名</span>
          <input
            type="text"
            data-field="customModel"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="custom-model-id"
            value={template.customModel}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                customModel: event.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <div
          className="rounded-xl border border-[rgba(129,140,248,0.4)] bg-gradient-to-br from-surface-muted/80 to-white px-4 py-3 text-xs text-[#334155] shadow-inner"
          data-role="query-preview"
        >
          {preview.query}
        </div>
        <div
          className="rounded-xl border border-[rgba(129,140,248,0.4)] bg-[rgba(255,255,255,0.7)] px-4 py-3 text-xs text-[#334155] shadow-inner"
          data-role="preview"
        >
          {preview.url}
        </div>
        <p
          className="text-xs font-medium text-rose-600"
          data-role="warning"
        >
          {warnings.join(' ')}
        </p>
      </div>
    </section>
  );
}

function OptionsApp(): JSX.Element {
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState('');
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let mounted = true;
    void loadSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }
        setDraft(toDraft(settings));
        setSelectedTemplateId(settings.templates[0]?.id ?? null);
        setDirty(false);
        setStatus('');
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
    if (!draft) {
      return;
    }
    const hasSelected = draft.templates.some(
      (template) => template.id === selectedTemplateId,
    );
    if (!hasSelected) {
      setSelectedTemplateId(draft.templates[0]?.id ?? null);
    }
  }, [draft, selectedTemplateId]);

  const markDirty = useCallback(() => {
    setDirty(true);
    setStatus('');
  }, []);

  const selectedTemplate = useMemo(() => {
    if (!draft) {
      return null;
    }
    return (
      draft.templates.find((template) => template.id === selectedTemplateId) ??
      null
    );
  }, [draft, selectedTemplateId]);

  const handleHardLimitChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraft((current) =>
        current ? { ...current, hardLimit: value } : current,
      );
      markDirty();
    },
    [markDirty],
  );

  const handleParentMenuTitleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDraft((current) =>
        current ? { ...current, parentMenuTitle: value } : current,
      );
      markDirty();
    },
    [markDirty],
  );

  const handleTemplateChange = useCallback(
    (
      templateId: string,
      updater: (current: TemplateDraft) => TemplateDraft,
    ) => {
      setDraft((current) => {
        if (!current) {
          return current;
        }
        const nextTemplates = current.templates.map((template) =>
          template.id === templateId ? updater(template) : template,
        );
        return {
          ...current,
          templates: nextTemplates,
        };
      });
      markDirty();
    },
    [markDirty],
  );

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setStatus('');
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!draft) {
        return;
      }

      const normalized = fromDraft(draft);
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
        setDraft(toDraft(normalized));
        setSelectedTemplateId((currentId) => {
          const next = normalized.templates.find(
            (template) => template.id === currentId,
          );
          return next ? next.id : (normalized.templates[0]?.id ?? null);
        });
        setDirty(false);
        setStatus('保存しました。');
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
      const defaults = normalizeSettings(DEFAULT_SETTINGS);
      await saveSettings(defaults);
      setDraft(toDraft(defaults));
      setSelectedTemplateId(defaults.templates[0]?.id ?? null);
      setDirty(false);
      setStatus('初期設定に戻しました。');
      setLoadingError(null);
    } catch (error) {
      console.error(error);
      window.alert('初期設定へのリセットに失敗しました。');
    } finally {
      setIsResetting(false);
    }
  }, [draft]);

  const statusText =
    loadingError ?? (dirty ? '未保存の変更があります。' : status);

  return (
    <div className="min-h-screen bg-[radial-gradient(140%_90%_at_20%_20%,rgba(56,189,248,0.1),transparent),_radial-gradient(90%_90%_at_80%_0%,rgba(129,140,248,0.1),transparent),_linear-gradient(180deg,#f0f5ff,#ffffff)] text-[#334155]">
      <main className="mx-auto max-w-[1120px] px-8 pt-14 pb-[72px]">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[rgba(148,163,184,0.25)] bg-[linear-gradient(135deg,rgba(30,64,175,0.8),rgba(124,58,237,0.85))] p-9 shadow-[0_30px_60px_-30px_rgba(76,29,149,0.5)] lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[rgba(248,250,252,0.88)]">
              Settings
            </span>
            <h1 className="mt-3 text-[2.2rem] font-semibold tracking-[-0.02em] text-white">
              ChatGPT Search Templater
            </h1>
            <p className="max-w-[640px] text-[14px] leading-[1.7] text-[rgba(226,232,240,0.9)]">
              プロンプトテンプレートと検索フローを一括管理。カスタムモデルやクエリのプレビューを確認しながら、自分好みのChatGPT体験をデザインできます。
            </p>
          </div>
          <div className="max-w-[320px] self-start rounded-[20px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)] px-5 py-[18px] text-[rgba(226,232,240,0.85)] lg:self-end">
            <p className="text-[14px] font-semibold text-white">ヒント</p>
            <ul className="mt-3 grid gap-[10px] list-disc pl-[18px] text-[13px] text-[rgba(226,232,240,0.85)]">
              <li>
                テンプレートはオン・オフを切り替えつつプレビューで即確認できます。
              </li>
              <li>
                「検索ヒント」「一時チャット」を組み合わせると、最新ChatGPTの検索挙動を最適化できます。
              </li>
            </ul>
          </div>
        </header>

        {draft ? (
          <form
            id="settingsForm"
            className="mt-10"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
              <aside className="flex flex-col gap-6 rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-6 backdrop-blur-[22px] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.4)]">
                <div className="flex flex-col gap-3">
                  <p className="text-[12px] uppercase tracking-[0.28em] text-[#475569]">
                    Templates
                  </p>
                  <h2 className="mt-1.5 text-[1.25rem] font-semibold text-[#1e293b]">
                    テンプレート一覧
                  </h2>
                  <p className="text-[13px] leading-[1.6] text-[#475569]">
                    左のリストから編集したいテンプレートを選択してください。
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {draft.templates.length === 0 ? (
                    <p className="rounded-[18px] border border-dashed border-[rgba(129,140,248,0.6)] px-4 py-[14px] text-center text-[13px] leading-[1.6] text-[#475569]">
                      テンプレートがありません。
                    </p>
                  ) : (
                    draft.templates.map((template) => {
                      const active = template.id === selectedTemplate?.id;
                      return (
                        <button
                          type="button"
                          key={template.id}
                          className={`flex w-full items-center justify-between gap-3 rounded-[18px] border border-[rgba(148,163,184,0.4)] bg-[rgba(255,255,255,0.5)] px-4 py-3 text-left font-semibold text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.6)] hover:bg-[rgba(255,255,255,0.8)] hover:text-[#0f172a] ${
                            active
                              ? 'border-transparent bg-[linear-gradient(135deg,rgba(123,97,255,0.8),rgba(56,189,248,0.7))] text-white shadow-[0_14px_30px_-20px_rgba(99,102,241,0.6)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(123,97,255,0.8),rgba(56,189,248,0.7))] hover:text-white'
                              : ''
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <span className="truncate">
                            {template.label || '未命名テンプレート'}
                          </span>
                          <span
                            className={`inline-flex items-center justify-center gap-1 rounded-full border border-transparent px-[10px] py-1 text-[11px] font-semibold ${
                              template.enabled
                                ? 'bg-[rgba(56,189,248,0.2)] text-[#0284c7]'
                                : 'border border-[rgba(148,163,184,0.5)] bg-[rgba(226,232,240,0.7)] text-[#475569]'
                            }`}
                          >
                            {template.enabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-[rgba(148,163,184,0.3)] pt-4 text-[12px] leading-[1.6] text-[#475569]">
                  <p>
                    テンプレートの保存内容は即時反映されます。ブラウザの再読み込みは不要です。
                  </p>
                </div>
              </aside>

              <div className="flex flex-col gap-7">
                <section className="rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.7)] px-7 py-8 backdrop-blur-[20px] shadow-[0_28px_60px_-35px_rgba(30,41,59,0.4)]">
                  <header className="mb-6">
                    <p className="text-[12px] uppercase tracking-[0.32em] text-[#475569]">
                      General Settings
                    </p>
                    <h2 className="mt-3 text-[1.6rem] font-semibold text-[#1e293b]">
                      基本設定
                    </h2>
                    <p className="mt-3 max-w-[520px] text-[14px] leading-[1.7] text-[#475569]">
                      URL長のハードリミットやメニューの親タイトルを調整します。
                    </p>
                  </header>
                  <div className="grid gap-5 md:grid-cols-2">
                    <label className="flex flex-col gap-[10px]">
                      <span className="text-sm font-medium text-[#334155]">
                        URLハードリミット (文字数)
                      </span>
                      <input
                        id="hardLimit"
                        type="number"
                        className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        min="0"
                        value={draft.hardLimit}
                        onChange={handleHardLimitChange}
                      />
                      <span className="text-[12px] text-[#475569]">
                        URLがこの長さを超えると自動でキャンセルします。
                      </span>
                    </label>
                    <label className="flex flex-col gap-[10px]">
                      <span className="text-sm font-medium text-[#334155]">
                        コンテキストメニュー親タイトル
                      </span>
                      <input
                        id="parentMenuTitle"
                        type="text"
                        className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition	duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="ChatGPT Search"
                        value={draft.parentMenuTitle}
                        onChange={handleParentMenuTitleChange}
                      />
                      <span className="text-[12px] text-[#475569]">
                        右クリックメニューの親見出しとして表示されます。
                      </span>
                    </label>
                  </div>
                </section>

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

                <div className="flex flex-col gap-[18px] rounded-[26px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.7)] px-7 py-[22px] backdrop-blur-[18px] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.4)] md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[#1e293b]">
                      変更を保存しますか？
                    </p>
                    <span
                      className="text-sm text-[#475569]"
                      id="statusText"
                    >
                      {isLoading ? '設定を読み込み中…' : statusText}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition duration-200 hover:border-indigo-400/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                      id="resetButton"
                      onClick={() => {
                        void handleReset();
                      }}
                      disabled={isSaving || isResetting}
                    >
                      {isResetting ? 'リセット中…' : '初期設定に戻す'}
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:shadow-indigo-500/40 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                      id="saveButton"
                      disabled={isSaving}
                    >
                      {isSaving ? '保存中…' : '保存する'}
                    </button>
                  </div>
                </div>
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
              <p className="text-xs font-medium text-rose-600">{loadingError}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }
  const root = createRoot(container);
  root.render(<OptionsApp />);
}

document.addEventListener('DOMContentLoaded', bootstrap);
