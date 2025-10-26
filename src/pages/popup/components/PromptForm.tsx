import type { FormEvent, JSX } from 'react';

interface PromptFormProps {
  selectedTemplateLabel: string | null;
  inputText: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  hasTemplates: boolean;
  isLoading: boolean;
  statusText: string;
}

export function PromptForm({
  selectedTemplateLabel,
  inputText,
  onInputChange,
  onSubmit,
  isSubmitting,
  hasTemplates,
  isLoading,
  statusText,
}: PromptFormProps): JSX.Element {
  return (
    <form
      className="flex flex-col gap-4 rounded-[22px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.75)] p-5 backdrop-blur-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_20px_35px_-32px_rgba(15,23,42,0.4)]"
      onSubmit={onSubmit}
    >
      <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.15)] px-[14px] py-[10px]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#475569]">
          使用するテンプレート
        </p>
        <p className="text-[14px] font-semibold text-[#1e293b]">
          {selectedTemplateLabel ?? '未選択'}
        </p>
      </div>

      <label htmlFor="inputText" className="text-sm font-medium text-slate-600">
        検索したいテキスト
      </label>
      <textarea
        id="inputText"
        className="min-h-36 w-full resize-y rounded-xl border border-border/70 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="選択テキストを貼り付けてください"
        spellCheck={false}
        value={inputText}
        onChange={(event) => onInputChange(event.target.value)}
        disabled={isLoading}
      />

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:shadow-indigo-500/40 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !hasTemplates}
      >
        <span>{isSubmitting ? '送信中…' : 'ChatGPT を開く'}</span>
      </button>

      <p className="min-h-5 text-center text-sm text-slate-500" id="statusMessage">
        {statusText}
      </p>
    </form>
  );
}
