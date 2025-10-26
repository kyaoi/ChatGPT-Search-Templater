import type { JSX } from 'react';

export function OptionsHero(): JSX.Element {
  return (
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
          <li>テンプレートはオン・オフを切り替えつつプレビューで即確認できます。</li>
          <li>「検索ヒント」「一時チャット」を組み合わせると、最新ChatGPTの検索挙動を最適化できます。</li>
        </ul>
      </div>
    </header>
  );
}
