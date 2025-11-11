import type { TemplateModelOption } from '@shared/settings.js';
import type { FormEvent, JSX } from 'react';
import { useCallback } from 'react';
import { usePickerController } from './hooks/usePickerController.js';

interface PickerAppProps {
  initialText: string;
}

export function PickerApp({ initialText }: PickerAppProps): JSX.Element {
  const {
    text,
    setText,
    templateUrl,
    setTemplateUrl,
    queryTemplate,
    setQueryTemplate,
    hintsSearch,
    setHintsSearch,
    temporaryChat,
    setTemporaryChat,
    modelOption,
    setModelOption,
    customModel,
    setCustomModel,
    isSubmitting,
    statusText,
    modelOptions,
    submit,
  } = usePickerController({ initialText });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const ok = await submit();
      if (ok) {
        window.setTimeout(() => {
          window.close();
        }, 200);
      }
    },
    [submit],
  );

  const handleClose = useCallback(() => {
    window.close();
  }, []);

  return (
    <div className="min-h-full w-full bg-[radial-gradient(130%_120%_at_10%_0%,rgba(96,165,250,0.12),transparent),_radial-gradient(120%_150%_at_100%_20%,rgba(129,140,248,0.18),transparent),_linear-gradient(135deg,#f8fbff,#eef2ff)] px-4 py-6 text-[#334155] sm:px-6">
      <div className="mx-auto flex w-full min-w-[360px] max-w-[560px] flex-col gap-5 rounded-[28px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.55)] backdrop-blur-[20px] sm:p-6 md:max-w-[640px]">
        <header className="flex flex-col gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#64748b]">
              ChatGPT Search Templater
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#0f172a]">
              クエリをカスタマイズ
            </h1>
          </div>
          <p className="text-sm leading-relaxed text-[#475569]">
            テンプレートを編集せず、その場で URL・クエリ・モデルを設定して
            ChatGPT 検索を実行できます。
          </p>
        </header>

        <form
          className="flex flex-col gap-5 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.96)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),_0_18px_40px_-32px_rgba(15,23,42,0.45)]"
          onSubmit={handleSubmit}
        >
          <section className="flex flex-col gap-2">
            <label
              htmlFor="templateUrl"
              className="text-sm font-medium text-[#334155]"
            >
              テンプレート URL
            </label>
            <input
              id="templateUrl"
              type="text"
              className="w-full rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/90 px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_10px_24px_-18px_rgb(15_23_42/0.35)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              value={templateUrl}
              onChange={(event) => setTemplateUrl(event.target.value)}
              placeholder="https://chatgpt.com/?prompt={TEXT}"
              spellCheck={false}
            />
            <p className="text-xs text-slate-500">
              <code>{'{TEXT}'}</code>{' '}
              などのプレースホルダを含めると、エンコード済みのクエリが差し込まれます。
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <label
              htmlFor="queryTemplate"
              className="text-sm font-medium text-[#334155]"
            >
              クエリテンプレート
            </label>
            <textarea
              id="queryTemplate"
              className="min-h-28 w-full resize-y rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/90 px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_12px_28px_-20px_rgb(15_23_42/0.45)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              value={queryTemplate}
              spellCheck={false}
              onChange={(event) => setQueryTemplate(event.target.value)}
              placeholder="{TEXT}"
            />
            <p className="text-xs text-slate-500">
              プレースホルダには <code>{'{TEXT}'}</code> または{' '}
              <code>{'{選択した文字列}'}</code> を使用できます。
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <label
              htmlFor="queryText"
              className="text-sm font-medium text-[#334155]"
            >
              クエリ本文
            </label>
            <textarea
              id="queryText"
              className="min-h-40 w-full resize-y rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/90 px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_12px_28px_-20px_rgb(15_23_42/0.45)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              value={text}
              spellCheck={false}
              onChange={(event) => setText(event.target.value)}
              placeholder="ChatGPTに渡すクエリ本文を入力してください"
            />
          </section>

          <section className="grid gap-4 md:grid-cols-[repeat(2,minmax(0,1fr))]">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[#334155]">モデル</span>
              <select
                className="w-full rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/90 px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                value={modelOption}
                onChange={(event) =>
                  setModelOption(event.target.value as TemplateModelOption)
                }
              >
                {modelOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'custom' ? 'カスタム' : option}
                  </option>
                ))}
              </select>
            </label>

            <label
              className={`flex flex-col gap-2 ${
                modelOption === 'custom' ? '' : 'hidden'
              }`}
              htmlFor="customModel"
            >
              <span className="text-sm font-medium text-[#334155]">
                カスタムモデル名
              </span>
              <input
                id="customModel"
                type="text"
                className="w-full rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/90 px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                value={customModel}
                onChange={(event) => setCustomModel(event.target.value)}
                placeholder="custom-model-id"
              />
            </label>
          </section>

          <section className="grid gap-3 md:grid-cols-[repeat(2,minmax(0,1fr))]">
            <label className="inline-flex items-center gap-3 text-sm text-[#334155]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={hintsSearch}
                onChange={(event) => setHintsSearch(event.target.checked)}
              />
              <span>Search ヒント（hints=search）</span>
            </label>
            <label className="inline-flex items-center gap-3 text-sm text-[#334155]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={temporaryChat}
                onChange={(event) => setTemporaryChat(event.target.checked)}
              />
              <span>一時チャット（temporary-chat=true）</span>
            </label>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(148,163,184,0.45)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.55)] hover:text-[#0f172a]"
              onClick={handleClose}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:shadow-indigo-500/40 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? '送信中…' : 'ChatGPT を開く'}</span>
            </button>
          </div>
        </form>

        <p className="min-h-5 text-center text-sm text-[#64748b]">
          {statusText}
        </p>
      </div>
    </div>
  );
}
