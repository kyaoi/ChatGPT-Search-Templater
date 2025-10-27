import type { ChangeEvent, JSX } from 'react';
import { useCallback, useMemo } from 'react';
import type { TemplateDraft, TemplateUpdater } from '../types.js';
import { templatePreview } from '../draftAdapter.js';
import { isTemplateModelOption } from '@shared/settings.js';

interface TemplateEditorProps {
  template: TemplateDraft;
  onChange: (updater: TemplateUpdater) => void;
}

export function TemplateEditor({
  template,
  onChange,
}: TemplateEditorProps): JSX.Element {
  const preview = useMemo(() => templatePreview(template), [template]);

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
      className="flex w-full max-w-full flex-col gap-6 overflow-hidden rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(240,245,255,0.8))] p-7 shadow-[0_30px_60px_-38px_rgba(30,41,59,0.4)]"
      data-template-id={template.id}
    >
      <header className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] uppercase tracking-[0.3em] text-[#475569]">
            テンプレート詳細
          </p>
          <h3 className="mt-1.5 truncate text-[1.4rem] font-semibold text-[#1e293b]">
            {template.label || '未命名テンプレート'}
          </h3>
        </div>
        <label className="inline-flex items-center gap-[10px] text-sm text-[#334155]">
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

      <div className="flex min-w-0 flex-col gap-[18px]">
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

      <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
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

      <div className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">モデル</span>
          <select
            data-field="model"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            value={template.model}
            onChange={(event) => {
              const { value } = event.target;
              if (!isTemplateModelOption(value)) {
                return;
              }
              onChange((current) => ({
                ...current,
                model: value,
              }));
            }}
          >
            <option value="gpt-4o">gpt-4o</option>
            <option value="o3">o3</option>
            <option value="gpt-5">gpt-5</option>
            <option value="gpt-5-thinking">gpt-5-thinking</option>
            <option value="custom">カスタム</option>
          </select>
        </label>
        <label
          className={`flex flex-col gap-[10px] ${showCustomModel ? '' : 'hidden'}`}
          data-role="custom-model"
        >
          <span className="text-sm font-medium text-[#334155]">
            カスタムモデル名
          </span>
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
          className="rounded-xl border border-[rgba(129,140,248,0.4)] bg-gradient-to-br from-surface-muted/80 to-white px-4 py-3 text-xs text-[#334155] shadow-inner break-words whitespace-pre-wrap"
          data-role="query-preview"
        >
          {preview.query}
        </div>
        <div
          className="rounded-xl border border-[rgba(129,140,248,0.4)] bg-[rgba(255,255,255,0.7)] px-4 py-3 text-xs text-[#334155] shadow-inner break-all"
          data-role="preview"
        >
          {preview.url}
        </div>
        <p className="text-xs font-medium text-rose-600" data-role="warning">
          {preview.warnings.join(' ')}
        </p>
      </div>
    </section>
  );
}
