import type { JSX } from 'react';
import type { TemplateDraft } from '../types.js';

interface TemplateListProps {
  templates: TemplateDraft[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
  onAdd: () => void;
}

export function TemplateList({
  templates,
  selectedTemplateId,
  onSelect,
  onAdd,
}: TemplateListProps): JSX.Element {
  return (
    <aside className="flex min-w-0 flex-col gap-6 rounded-[32px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.82)] p-7 backdrop-blur-[24px] shadow-[0_36px_90px_-40px_rgba(15,23,42,0.45)] xl:sticky xl:top-6 xl:h-fit">
      <div className="flex flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#64748b]">
          Templates
        </p>
        <h2 className="mt-1.5 text-[1.35rem] font-semibold text-[#0f172a]">
          テンプレート一覧
        </h2>
        <p className="text-[13px] leading-[1.6] text-[#475569]">
          左のリストから編集したいテンプレートを選択してください。
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {templates.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[rgba(129,140,248,0.6)] px-4 py-[14px] text-center text-[13px] leading-[1.6] text-[#64748b]">
            テンプレートがありません。
          </p>
        ) : (
          templates.map((template) => {
            const active = template.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={template.id}
                className={`flex w-full items-center justify-between gap-3 rounded-[18px] border border-[rgba(148,163,184,0.36)] bg-[rgba(248,250,252,0.85)] px-4 py-3 text-left font-semibold text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.6)] hover:bg-white hover:text-[#0f172a] ${
                  active
                    ? 'border-transparent bg-[linear-gradient(135deg,rgba(123,97,255,0.82),rgba(56,189,248,0.7))] text-white shadow-[0_18px_40px_-28px_rgba(99,102,241,0.65)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(123,97,255,0.82),rgba(56,189,248,0.7))] hover:text-white'
                    : ''
                }`}
                onClick={() => onSelect(template.id)}
              >
                <span className="min-w-0 flex-1 truncate pr-3">
                  {template.label || '未命名テンプレート'}
                </span>
                <span
                  className={`inline-flex items-center justify-center gap-1 rounded-full border border-transparent px-[10px] py-1 text-[11px] font-semibold ${
                    template.enabled
                      ? 'bg-[rgba(56,189,248,0.2)] text-[#0284c7]'
                      : 'border border-[rgba(148,163,184,0.5)] bg-[rgba(226,232,240,0.7)] text-[#475569]'
                  }`}
                >
                  {template.enabled ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })
        )}
      </div>
      <button
        type="button"
        className="flex items-center justify-center gap-2 rounded-[18px] border border-dashed border-[rgba(129,140,248,0.6)] px-4 py-[14px] text-[13px] font-semibold text-primary transition duration-200 hover:border-primary hover:bg-white"
        onClick={onAdd}
      >
        <span className="text-lg leading-none">＋</span>
        テンプレートを追加
      </button>
      <div className="border-t border-[rgba(148,163,184,0.3)] pt-4 text-[12px] leading-[1.6] text-[#475569]">
        <p>テンプレートの保存内容は即時反映されます。ブラウザの再読み込みは不要です。</p>
      </div>
    </aside>
  );
}
