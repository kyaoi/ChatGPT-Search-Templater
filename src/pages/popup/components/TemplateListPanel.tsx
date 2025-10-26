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

  return (
    <aside className="flex min-w-0 flex-col gap-4 rounded-[28px] border border-[rgba(148,163,184,0.28)] bg-[rgba(255,255,255,0.82)] p-5 shadow-[0_26px_60px_-44px_rgba(30,41,59,0.55)]">
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
      <div className="flex flex-col gap-2.5">
        {!hasTemplates ? (
          <p className="rounded-[16px] border border-dashed border-[rgba(148,163,184,0.6)] px-3 py-[12px] text-center text-[13px] leading-[1.5] text-[#64748b]">
            有効なテンプレートがありません。
          </p>
        ) : (
          templates.map((template) => {
            const active = template.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={template.id}
                className={`flex w-full items-center justify-between gap-3 rounded-[16px] border border-transparent bg-[rgba(248,250,252,0.8)] px-[14px] py-3 text-left text-[13px] font-medium text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.55)] hover:bg-white hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-transparent bg-[linear-gradient(135deg,rgba(129,140,248,0.8),rgba(56,189,248,0.7))] text-white shadow-[0_12px_28px_-18px_rgba(56,189,248,0.85)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(129,140,248,0.8),rgba(56,189,248,0.7))] hover:text-white'
                    : ''
                }`}
                onClick={() => onSelect(template.id)}
                disabled={isLoading}
              >
                <span className="truncate">{template.label}</span>
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        className="rounded-[14px] border border-[rgba(129,140,248,0.5)] px-[14px] py-[10px] text-[13px] font-semibold text-[#334155] transition duration-200 hover:border-[rgba(56,189,248,0.6)] hover:bg-[rgba(255,255,255,0.88)] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onOpenOptions}
      >
        テンプレートを編集
      </button>
    </aside>
  );
}
