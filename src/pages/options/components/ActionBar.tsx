import type { JSX } from 'react';

interface ActionBarProps {
  isLoading: boolean;
  statusText: string;
  isSaving: boolean;
  isResetting: boolean;
  isImporting: boolean;
  onReset: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function ActionBar({
  isLoading,
  statusText,
  isSaving,
  isResetting,
  isImporting,
  onReset,
  onImport,
  onExport,
}: ActionBarProps): JSX.Element {
  return (
    <div className="flex w-full max-w-full flex-col gap-[18px] overflow-hidden rounded-[26px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.7)] px-7 py-[22px] backdrop-blur-[18px] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.4)] md:flex-row md:items-center md:justify-between md:gap-6">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#1e293b]">変更を保存しますか？</p>
        <span className="text-sm text-[#475569]" id="statusText">
          {isLoading ? '設定を読み込み中…' : statusText}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(148,163,184,0.6)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition duration-200 hover:border-indigo-400/70 hover:text-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onImport}
          disabled={isSaving || isResetting || isImporting}
        >
          {isImporting ? 'インポート中…' : '設定をインポート'}
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[rgba(148,163,184,0.6)] bg-white/80 px-4 py-2.5 text-sm font-semibold text-[#1e293b] transition duration-200 hover:border-indigo-400/70 hover:text-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onExport}
          disabled={isSaving || isResetting || isImporting}
        >
          設定をエクスポート
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition duration-200 hover:border-indigo-400/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          id="resetButton"
          onClick={onReset}
          disabled={isSaving || isResetting || isImporting}
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
  );
}
