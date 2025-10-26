import type { JSX } from 'react';

export function HeroSection(): JSX.Element {
  return (
    <section className="w-full rounded-[26px] border border-[rgba(129,140,248,0.35)] bg-[linear-gradient(135deg,rgba(59,130,246,0.8),rgba(124,58,237,0.85))] p-6 shadow-[0_24px_50px_-28px_rgba(79,70,229,0.6)]">
      <div className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
          Quick Prompt
        </span>
        <h1 className="text-[1.6rem] font-semibold text-white">
          ChatGPT Search
        </h1>
        <p className="mt-2 text-[13px] leading-[1.6] text-[rgba(226,232,240,0.9)]">
          選択テキストを即座にテンプレートへ差し込み、洗練されたプロンプトでChatGPTを呼び出します。
        </p>
      </div>
    </section>
  );
}
