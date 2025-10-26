import type { ChangeEvent, JSX } from 'react';

interface GeneralSettingsSectionProps {
  hardLimit: string;
  parentMenuTitle: string;
  onHardLimitChange: (value: string) => void;
  onParentMenuTitleChange: (value: string) => void;
}

export function GeneralSettingsSection({
  hardLimit,
  parentMenuTitle,
  onHardLimitChange,
  onParentMenuTitleChange,
}: GeneralSettingsSectionProps): JSX.Element {
  const handleHardLimit = (event: ChangeEvent<HTMLInputElement>) => {
    onHardLimitChange(event.target.value);
  };

  const handleParentTitle = (event: ChangeEvent<HTMLInputElement>) => {
    onParentMenuTitleChange(event.target.value);
  };

  return (
    <section className="w-full max-w-full overflow-hidden rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.7)] px-7 py-8 backdrop-blur-[20px] shadow-[0_28px_60px_-35px_rgba(30,41,59,0.4)]">
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
      <div className="grid gap-5 md:grid-cols-[repeat(2,minmax(0,1fr))]">
        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">
            URLハードリミット (文字数)
          </span>
          <input
            id="hardLimit"
            type="number"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            min="0"
            value={hardLimit}
            onChange={handleHardLimit}
          />
        </label>
        <label className="flex flex-col gap-[10px]">
          <span className="text-sm font-medium text-[#334155]">
            コンテキストメニュー親タイトル
          </span>
          <input
            id="parentMenuTitle"
            type="text"
            className="w-full rounded-xl border border-[rgba(148,163,184,0.5)] bg-[rgba(255,255,255,0.8)] px-3.5 py-2.5 text-sm text-[#0f172a] shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-[#64748b] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="ChatGPT Search"
            value={parentMenuTitle}
            onChange={handleParentTitle}
          />
          <span className="text-[12px] text-[#475569]">
            右クリックメニューの親見出しとして表示されます。
          </span>
        </label>
      </div>
    </section>
  );
}
