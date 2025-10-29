import type { JSX } from 'react';
import type { TemplateOption } from '../types.js';

interface TemplateListPanelProps {
  templates: TemplateOption[];
  selectedTemplateId: string;
  onSelect: (templateId: string) => void;
  isLoading: boolean;
  onOpenOptions: () => void;
}

export function TemplateListPanel({
  templates,
  selectedTemplateId,
  onSelect,
  isLoading,
  onOpenOptions,
}: TemplateListPanelProps): JSX.Element {
  const hasTemplates = templates.length > 0;

  const renderCardButtons = (): JSX.Element => {
    if (!hasTemplates) {
      return (
        <p className="rounded-[16px] border border-dashed border-[rgba(148,163,184,0.6)] px-3 py-[12px] text-center text-[13px] leading-[1.5] text-[#64748b]">
          有効なテンプレートがありません。
        </p>
      );
    }

    return (
      <>
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          return (
            <button
              type="button"
              key={template.id}
              className={`flex w-full items-center justify-between gap-3 rounded-[16px] border border-transparent bg-[rgba(248,250,252,0.85)] px-[14px] py-3 text-left text-[13px] font-medium text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.55)] hover:bg-white hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? 'border-transparent bg-[linear-gradient(135deg,rgba(129,140,248,0.82),rgba(56,189,248,0.72))] text-white shadow-[0_12px_28px_-18px_rgba(56,189,248,0.8)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(129,140,248,0.82),rgba(56,189,248,0.72))] hover:text-white'
                  : ''
              }`}
              onClick={() => onSelect(template.id)}
              disabled={isLoading}
              aria-pressed={active}
            >
              <span className="truncate">{template.label}</span>
              {template.isDefault ? (
                <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#334155] shadow-sm">
                  既定
                </span>
              ) : null}
            </button>
          );
        })}
      </>
    );
  };

  const renderPillButtons = (): JSX.Element => {
    if (!hasTemplates) {
      return (
        <p className="w-full rounded-[14px] border border-dashed border-[rgba(148,163,184,0.5)] px-4 py-3 text-center text-xs text-[#64748b]">
          有効なテンプレートがありません。
        </p>
      );
    }

    return (
      <>
        {templates.map((template) => {
          const active = template.id === selectedTemplateId;
          return (
            <button
              type="button"
              key={`pill-${template.id}`}
              className={`inline-flex items-center gap-2 shrink-0 rounded-full border border-transparent px-4 py-2 text-xs font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 ${
                active
                  ? 'bg-[linear-gradient(135deg,rgba(129,140,248,0.9),rgba(56,189,248,0.8))] text-white shadow-[0_10px_24px_-18px_rgba(99,102,241,0.7)]'
                  : 'bg-white/80 text-[#334155] shadow-sm hover:border-[rgba(129,140,248,0.5)] hover:text-[#0f172a]'
              }`}
              onClick={() => onSelect(template.id)}
              disabled={isLoading}
              aria-pressed={active}
            >
              <span className="whitespace-nowrap">{template.label}</span>
              {template.isDefault ? (
                <span className="ml-2 inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-500/90 px-2 py-[2px] text-[10px] font-semibold text-white">
                  既定
                </span>
              ) : null}
            </button>
          );
        })}
      </>
    );
  };

  return (
    <aside className="flex min-w-0 flex-col gap-4 md:gap-6">
      <section className="flex flex-col gap-3 rounded-[22px] border border-[rgba(148,163,184,0.2)] bg-[rgba(255,255,255,0.9)] px-4 py-4 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.45)] md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#64748b]">
              テンプレート
            </p>
            <h2 className="mt-1 text-[1.1rem] font-semibold text-[#0f172a]">
              クイックリスト
            </h2>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-[rgba(129,140,248,0.45)] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#334155] transition duration-200 hover:border-[rgba(56,189,248,0.6)] hover:text-[#0f172a]"
            onClick={onOpenOptions}
          >
            編集
          </button>
        </div>
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {renderPillButtons()}
        </div>
      </section>

      <section className="hidden min-w-0 flex-col gap-4 rounded-[28px] border border-[rgba(148,163,184,0.28)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_26px_60px_-44px_rgba(30,41,59,0.55)] md:flex md:sticky md:top-0 md:self-start">
        <div className="flex flex-col gap-[6px]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#64748b]">
            テンプレート
          </p>
          <h2 className="text-[1.25rem] font-semibold text-[#0f172a]">
            クイックリスト
          </h2>
          <p className="text-[13px] leading-[1.6] text-[#475569]">
            使用したいテンプレートを選んでください。
          </p>
        </div>
        <div className="flex flex-col gap-2.5">{renderCardButtons()}</div>
        <button
          type="button"
          className="rounded-[14px] border border-[rgba(129,140,248,0.5)] px-[14px] py-[10px] text-[13px] font-semibold text-[#334155] transition duration-200 hover:border-[rgba(56,189,248,0.6)] hover:bg-[rgba(255,255,255,0.88)] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={onOpenOptions}
        >
          テンプレートを編集
        </button>
      </section>
    </aside>
  );
}
