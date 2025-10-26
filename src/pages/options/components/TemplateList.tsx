import type { JSX } from 'react';
import type { TemplateDraft } from '../types.js';

interface TemplateListProps {
  templates: TemplateDraft[];
  selectedTemplateId: string | null;
  onSelect: (templateId: string) => void;
}

export function TemplateList({
  templates,
  selectedTemplateId,
  onSelect,
}: TemplateListProps): JSX.Element {
  return (
    <aside className="flex flex-col gap-6 rounded-[28px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-6 backdrop-blur-[22px] shadow-[0_25px_50px_-30px_rgba(15,23,42,0.4)]">
      <div className="flex flex-col gap-3">
        <p className="text-[12px] uppercase tracking-[0.28em] text-[#475569]">
          Templates
        </p>
        <h2 className="mt-1.5 text-[1.25rem] font-semibold text-[#1e293b]">
          テンプレート一覧
        </h2>
        <p className="text-[13px] leading-[1.6] text-[#475569]">
          左のリストから編集したいテンプレートを選択してください。
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {templates.length === 0 ? (
          <p className="rounded-[18px] border border-dashed border-[rgba(129,140,248,0.6)] px-4 py-[14px] text-center text-[13px] leading-[1.6] text-[#475569]">
            テンプレートがありません。
          </p>
        ) : (
          templates.map((template) => {
            const active = template.id === selectedTemplateId;
            return (
              <button
                type="button"
                key={template.id}
                className={`flex w-full items-center justify-between gap-3 rounded-[18px] border border-[rgba(148,163,184,0.4)] bg-[rgba(255,255,255,0.5)] px-4 py-3 text-left font-semibold text-[#334155] transition duration-200 hover:border-[rgba(129,140,248,0.6)] hover:bg-[rgba(255,255,255,0.8)] hover:text-[#0f172a] ${
                  active
                    ? 'border-transparent bg-[linear-gradient(135deg,rgba(123,97,255,0.8),rgba(56,189,248,0.7))] text-white shadow-[0_14px_30px_-20px_rgba(99,102,241,0.6)] hover:border-transparent hover:bg-[linear-gradient(135deg,rgba(123,97,255,0.8),rgba(56,189,248,0.7))] hover:text-white'
                    : ''
                }`}
                onClick={() => onSelect(template.id)}
              >
                <span className="truncate">
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
      <div className="border-t border-[rgba(148,163,184,0.3)] pt-4 text-[12px] leading-[1.6] text-[#475569]">
        <p>テンプレートの保存内容は即時反映されます。ブラウザの再読み込みは不要です。</p>
      </div>
    </aside>
  );
}
