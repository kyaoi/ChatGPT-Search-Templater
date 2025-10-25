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
    <section className="template-editor" data-template-id={template.id}>
      <header className="template-editor__header">
        <div>
          <p className="template-editor__caption">テンプレート詳細</p>
          <h3 className="template-editor__title">
            {template.label || '未命名テンプレート'}
          </h3>
        </div>
        <label className="switch-control template-editor__toggle">
          <input
            type="checkbox"
            data-field="enabled"
            className="h-4 w-4 accent-primary"
            checked={template.enabled}
            onChange={handleCheckboxChange('enabled')}
          />
          <span className="font-medium text-slate-100">有効</span>
        </label>
      </header>

      <div className="template-editor__section">
        <label className="template-editor__field">
          <span className="field-label">メニュー表示名</span>
          <input
            type="text"
            data-field="label"
            className="input-field"
            placeholder="メニュー表示名"
            value={template.label}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                label: event.target.value,
              }))
            }
          />
          <small className="template-editor__hint">
            コンテキストメニューに表示されます。
          </small>
        </label>

        <label className="template-editor__field">
          <span className="field-label">テンプレートURL</span>
          <input
            type="text"
            data-field="url"
            className="input-field"
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

        <label className="template-editor__field">
          <span className="field-label">検索内容テンプレート</span>
          <textarea
            data-field="queryTemplate"
            className="input-field min-h-32"
            placeholder={'以下の文章を日本語に直してください。\n\n{TEXT}'}
            value={template.queryTemplate}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                queryTemplate: event.target.value,
              }))
            }
          />
          <small className="template-editor__hint">
            {`{TEXT} / {選択した文字列} が選択テキストに置き換わります。リテラル {TEXT} を表示したい場合は {{TEXT}} と入力してください。`}
          </small>
        </label>
      </div>

      <div className="template-editor__section template-editor__section--grid">
        <label className="switch-control">
          <input
            type="checkbox"
            data-field="hintsSearch"
            className="h-4 w-4 accent-primary"
            checked={template.hintsSearch}
            onChange={handleCheckboxChange('hintsSearch')}
          />
          <span>Searchヒント（hints=search）</span>
        </label>
        <label className="switch-control">
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

      <div className="template-editor__section template-editor__section--grid">
        <label className="template-editor__field">
          <span className="field-label">モデル</span>
          <select
            data-field="model"
            className="input-field"
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
          className={`template-editor__field ${showCustomModel ? '' : 'hidden'}`}
          data-role="custom-model"
        >
          <span className="field-label">カスタムモデル名</span>
          <input
            type="text"
            data-field="customModel"
            className="input-field"
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

      <div className="template-editor__preview">
        <div
          className="preview-panel preview-panel--query"
          data-role="query-preview"
        >
          {preview.query}
        </div>
        <div className="preview-panel" data-role="preview">
          {preview.url}
        </div>
        <p className="warning-text" data-role="warning">
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
    <div className="options-wrapper">
      <main className="options-container">
        <header className="options-hero">
          <div className="options-hero__content">
            <span className="chip chip--ghost">Settings</span>
            <h1>ChatGPT Search Templater</h1>
            <p>
              プロンプトテンプレートと検索フローを一括管理。カスタムモデルやクエリのプレビューを確認しながら、自分好みのChatGPT体験をデザインできます。
            </p>
          </div>
          <div className="options-hero__tips">
            <p className="options-hero__tips-title">ヒント</p>
            <ul>
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
            className="options-form"
            onSubmit={handleSubmit}
          >
            <div className="options-layout">
              <aside className="options-sidebar">
                <div className="options-sidebar__intro">
                  <p className="sidebar-caption">Templates</p>
                  <h2>テンプレート一覧</h2>
                  <p>
                    左のリストから編集したいテンプレートを選択してください。
                  </p>
                </div>
                <div className="options-sidebar__list">
                  {draft.templates.length === 0 ? (
                    <p className="options-sidebar__empty">
                      テンプレートがありません。
                    </p>
                  ) : (
                    draft.templates.map((template) => {
                      const active = template.id === selectedTemplate?.id;
                      return (
                        <button
                          type="button"
                          key={template.id}
                          className={`options-sidebar__item ${
                            active ? 'is-active' : ''
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <span className="options-sidebar__item-label">
                            {template.label || '未命名テンプレート'}
                          </span>
                          <span
                            className={`options-sidebar__badge ${
                              template.enabled ? 'is-on' : 'is-off'
                            }`}
                          >
                            {template.enabled ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="options-sidebar__note">
                  <p>
                    テンプレートの保存内容は即時反映されます。ブラウザの再読み込みは不要です。
                  </p>
                </div>
              </aside>

              <div className="options-main">
                <section className="options-panel options-panel--general">
                  <header className="options-panel__header">
                    <p className="options-panel__caption">General Settings</p>
                    <h2>基本設定</h2>
                    <p>
                      URL長のハードリミットやメニューの親タイトルを調整します。
                    </p>
                  </header>
                  <div className="options-panel__grid">
                    <label className="options-panel__field">
                      <span className="field-label">
                        URLハードリミット (文字数)
                      </span>
                      <input
                        id="hardLimit"
                        type="number"
                        className="input-field"
                        min="0"
                        value={draft.hardLimit}
                        onChange={handleHardLimitChange}
                      />
                      <span className="options-panel__hint">
                        URLがこの長さを超えると自動でキャンセルします。
                      </span>
                    </label>
                    <label className="options-panel__field">
                      <span className="field-label">
                        コンテキストメニュー親タイトル
                      </span>
                      <input
                        id="parentMenuTitle"
                        type="text"
                        className="input-field"
                        placeholder="ChatGPT Search"
                        value={draft.parentMenuTitle}
                        onChange={handleParentMenuTitleChange}
                      />
                      <span className="options-panel__hint">
                        右クリックメニューの親見出しとして表示されます。
                      </span>
                    </label>
                  </div>
                </section>

                <section className="options-panel options-panel--template">
                  {selectedTemplate ? (
                    <TemplateEditor
                      template={selectedTemplate}
                      onChange={(updater) =>
                        handleTemplateChange(selectedTemplate.id, updater)
                      }
                    />
                  ) : (
                    <div className="options-panel__empty">
                      テンプレートを左のリストから選択してください。
                    </div>
                  )}
                </section>

                <div className="options-actions">
                  <div>
                    <p className="options-actions__title">
                      変更を保存しますか？
                    </p>
                    <span className="status-text" id="statusText">
                      {isLoading ? '設定を読み込み中…' : statusText}
                    </span>
                  </div>
                  <div className="options-actions__buttons">
                    <button
                      type="button"
                      className="btn-secondary"
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
                      className="btn-primary"
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
          <section className="options-empty">
            <p>
              {isLoading
                ? '設定を読み込み中…'
                : '設定を読み込めませんでした。ページを再読み込みしてください。'}
            </p>
            {loadingError && <p className="warning-text">{loadingError}</p>}
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
