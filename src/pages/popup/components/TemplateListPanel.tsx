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
    <aside className="flex flex-none basis-[152px] flex-col gap-[14px] max-[520px]:basis-auto">
      <div className="flex flex-col gap-1">
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#475569]">
          テンプレート
        </p>
        <h2 className="text-[1.1rem] font-semibold text-[#1e293b]">
          クイックリスト
        </h2>
        <p className="text-[13px] leading-[1.6] text-[#475569]">
          使用したいテンプレートを選んでください。
        </p>
      </div>
      <div className="flex flex-col gap-[10px]">
        {!hasTemplates ? (
          <p className="rounded-[16px] border border-dashed border-[rgba(148,163,184,0.6)] px-3 py-[12px] text-center text-[13px] leading-[1.5] text-[#475569]">
            有効なテンプレートがありません。
          </p>
        ) : (
          templates.map((template) => {
            const active = template.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={template.id}
                className={`flex w-full items-center justify-between gap-3 rounded-[16px] border border-transparent bg-[rgba(255,255,255,0.5)] px-[14px] py-[10px] text-left text-[13px] font-medium text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.55)] hover:bg-[rgba(255,255,255,0.8)] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? 'border-transparent bg-[linear-gradient(135deg,rgba(129,140,248,0.8),rgba(56,189,248,0.7))] text-white shadow-[0_12px_28px_-18px_rgba(56,189,248,0.85)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(129,140,248,0.8),rgba(56,189,248,0.7))] hover:text-white'
                    : ''
                }`}
                onClick={() => onSelect(template.id)}
                disabled={isLoading}
              >
                <span>{template.label}</span>
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        className="rounded-[14px] border border-[rgba(129,140,248,0.5)] px-[14px] py-[10px] text-[13px] font-semibold text-[#334155] transition duration-200 hover:border-[rgba(56,189,248,0.6)] hover:bg-[rgba(255,255,255,0.7)] hover:text-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onOpenOptions}
      >
        テンプレートを編集
      </button>
    </aside>
  );
}
