import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { JSX } from "react";
import { createRoot } from "react-dom/client";
import { buildChatGPTUrl } from "./lib/urlBuilder.js";
import {
  DEFAULT_SETTINGS,
  ExtensionSettings,
  TemplateModelOption,
  TemplateSettings,
  collectTemplateWarnings,
  normalizeSettings,
  resolveModelId,
} from "./lib/settings.js";
import { loadSettings, saveSettings } from "./lib/storage.js";

const SAMPLE_TEXT = "日本の大規模言語モデル事情";

type TemplateDraft = Omit<TemplateSettings, "customModel"> & {
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
      customModel: template.customModel ?? "",
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

interface TemplateCardProps {
  template: TemplateDraft;
  onChange: (updater: (current: TemplateDraft) => TemplateDraft) => void;
}

function TemplateCard({ template, onChange }: TemplateCardProps): JSX.Element {
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
    (key: "enabled" | "hintsSearch" | "temporaryChat") =>
      (event: ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        onChange((current) => ({
          ...current,
          [key]: checked,
        }));
      },
    [onChange],
  );

  const showCustomModel = template.model === "custom";

  return (
    <article
      className="template-card surface-section flex flex-col gap-6 px-6 py-6"
      data-template-id={template.id}
    >
      <header className="flex flex-col gap-4">
        <label className="switch-control">
          <input
            type="checkbox"
            data-field="enabled"
            className="h-4 w-4 accent-primary"
            checked={template.enabled}
            onChange={handleCheckboxChange("enabled")}
          />
          <span className="font-medium text-slate-700">有効にする</span>
        </label>
        <div className="space-y-2">
          <label className="field-label" data-role="template-heading">
            メニュー表示名
          </label>
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
          <small className="text-xs text-slate-400">
            コンテキストメニューに表示されます。
          </small>
        </div>
      </header>

      <div className="space-y-4">
        <label className="flex flex-col gap-2">
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

        <label className="flex flex-col gap-2">
          <span className="field-label">検索内容テンプレート</span>
          <textarea
            data-field="queryTemplate"
            className="input-field min-h-32"
            placeholder={"以下の文章を日本語に直してください。\n\n{TEXT}"}
            value={template.queryTemplate}
            onChange={(event) =>
              onChange((current) => ({
                ...current,
                queryTemplate: event.target.value,
              }))
            }
          />
          <small className="text-xs text-slate-400">
            {`{TEXT} / {選択した文字列} が選択テキストに置き換わります。リテラル {TEXT} を表示したい場合は {{TEXT}} と入力してください。`}
          </small>
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="switch-control">
            <input
              type="checkbox"
              data-field="hintsSearch"
              className="h-4 w-4 accent-primary"
              checked={template.hintsSearch}
              onChange={handleCheckboxChange("hintsSearch")}
            />
            <span>Searchヒント（hints=search）</span>
          </label>
          <label className="switch-control">
            <input
              type="checkbox"
              data-field="temporaryChat"
              className="h-4 w-4 accent-primary"
              checked={template.temporaryChat}
              onChange={handleCheckboxChange("temporaryChat")}
            />
            <span>一時チャット（temporary-chat=true）</span>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2">
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
            className={`flex flex-col gap-2 ${showCustomModel ? "" : "hidden"}`}
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
      </div>

      <div className="space-y-3">
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
          {warnings.join(" ")}
        </p>
      </div>
    </article>
  );
}

function OptionsApp(): JSX.Element {
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("");
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void loadSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }
        setDraft(toDraft(settings));
        setDirty(false);
        setStatus("");
        setLoadingError(null);
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setLoadingError("設定の読み込みに失敗しました。");
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

  const markDirty = useCallback(() => {
    setDirty(true);
    setStatus("");
  }, []);

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
          "プレースホルダを含まないテンプレートがあります。このまま保存してもよろしいですか？",
        );
        if (!proceed) {
          return;
        }
      }

      setIsSaving(true);
      try {
        await saveSettings(normalized);
        setDraft(toDraft(normalized));
        setDirty(false);
        setStatus("保存しました。");
        setLoadingError(null);
      } catch (error) {
        console.error(error);
        window.alert("保存に失敗しました。もう一度お試しください。");
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
      "初期設定に戻しますか？保存されているテンプレートは上書きされます。",
    );
    if (!confirmed) {
      return;
    }

    setIsResetting(true);
    try {
      const defaults = normalizeSettings(DEFAULT_SETTINGS);
      await saveSettings(defaults);
      setDraft(toDraft(defaults));
      setDirty(false);
      setStatus("初期設定に戻しました。");
      setLoadingError(null);
    } catch (error) {
      console.error(error);
      window.alert("初期設定へのリセットに失敗しました。");
    } finally {
      setIsResetting(false);
    }
  }, [draft]);

  const statusText =
    loadingError ?? (dirty ? "未保存の変更があります。" : status);

  return (
    <div className="min-h-screen bg-surface/60 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <header className="gradient-header overflow-hidden px-8 py-10">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="chip bg-white/25 text-white/80">Settings</span>
              <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                ChatGPT Search Templater
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/80">
                プロンプトテンプレートと検索フローを一括管理。カスタムモデルやクエリのプレビューを確認しながら、
                自分好みのChatGPT体験をデザインできます。
              </p>
            </div>
            <div className="glass-highlight rounded-2xl px-6 py-5 text-sm text-white/80">
              <p className="font-medium text-white">ヒント</p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white/70"></span>
                  <span>
                    テンプレートはオン・オフを切り替えつつプレビューで即確認できます。
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-white/70"></span>
                  <span>
                    「検索ヒント」「一時チャット」を組み合わせると、最新ChatGPTの検索挙動を最適化できます。
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {draft ? (
          <form
            id="settingsForm"
            className="mt-10 flex flex-col gap-10"
            onSubmit={handleSubmit}
          >
            <section className="surface-card px-7 py-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="section-title">General Settings</p>
                  <h2 className="text-xl font-semibold">基本設定</h2>
                  <p className="text-sm text-slate-500">
                    URL長のハードリミットやメニューの親タイトルを調整します。
                  </p>
                </div>
                <div className="glass-highlight rounded-xl px-4 py-3 text-sm text-white/80 md:w-64">
                  <p className="font-medium text-white">現在の状況</p>
                  <div className="mt-2 space-y-1 text-[13px]">
                    <p>テンプレート保存は即時反映されます。</p>
                    <p>Chrome 拡張のリロードは不要です。</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <label className="flex flex-col gap-2">
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
                  <span className="text-xs text-slate-400">
                    URLがこの長さを超えると自動でキャンセルします。
                  </span>
                </label>
                <label className="flex flex-col gap-2">
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
                  <span className="text-xs text-slate-400">
                    右クリックメニューの親見出しとして表示されます。
                  </span>
                </label>
              </div>
            </section>

            <section className="surface-card px-7 py-8">
              <div className="flex flex-col gap-3">
                <p className="section-title">Templates</p>
                <h2 className="text-xl font-semibold">
                  テンプレートをカスタマイズ
                </h2>
                <p className="text-sm text-slate-500">
                  個別のテンプレートでURL・プロンプト・モデル設定を細かく制御します。プレビューで生成結果を確認しながら編集できます。
                </p>
              </div>

              <div className="template-grid mt-8 grid gap-8 lg:grid-cols-2">
                {draft.templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onChange={(updater) =>
                      handleTemplateChange(template.id, updater)
                    }
                  />
                ))}
              </div>
            </section>

            <div className="surface-card flex flex-col gap-6 px-7 py-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-700">
                  変更を保存しますか？
                </p>
                <span className="status-text" id="statusText">
                  {isLoading ? "設定を読み込み中…" : statusText}
                </span>
              </div>
              <div className="flex flex-col gap-3 md:flex-row">
                <button
                  type="button"
                  className="btn-secondary md:min-w-[160px]"
                  id="resetButton"
                  onClick={() => {
                    void handleReset();
                  }}
                  disabled={isSaving || isResetting}
                >
                  {isResetting ? "リセット中…" : "初期設定に戻す"}
                </button>
                <button
                  type="submit"
                  className="btn-primary md:min-w-[160px]"
                  id="saveButton"
                  disabled={isSaving}
                >
                  {isSaving ? "保存中…" : "保存する"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <section className="surface-card mt-10 flex flex-col gap-4 px-7 py-8 text-sm text-slate-600">
            <p>
              {isLoading
                ? "設定を読み込み中…"
                : "設定を読み込めませんでした。ページを再読み込みしてください。"}
            </p>
            {loadingError && (
              <p className="warning-text text-sm">{loadingError}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function bootstrap(): void {
  const container = document.getElementById("root");
  if (!container) {
    return;
  }
  const root = createRoot(container);
  root.render(<OptionsApp />);
}

document.addEventListener("DOMContentLoaded", bootstrap);
