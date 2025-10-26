import type { JSX } from 'react';

interface ActionBarProps {
  isLoading: boolean;
  statusText: string;
  isSaving: boolean;
  isResetting: boolean;
  onReset: () => void;
}

export function ActionBar({
  isLoading,
  statusText,
  isSaving,
  isResetting,
  onReset,
}: ActionBarProps): JSX.Element {
  return (
    <div className="flex flex-col gap-[18px] rounded-[26px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.7)] px-7 py-[22px] backdrop-blur-[18px] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.4)] md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-semibold text-[#1e293b]">変更を保存しますか？</p>
        <span className="text-sm text-[#475569]" id="statusText">
          {isLoading ? '設定を読み込み中…' : statusText}
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-100 transition duration-200 hover:border-indigo-400/70 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60"
          id="resetButton"
          onClick={onReset}
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
  );
}
