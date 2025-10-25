import type { JSX } from 'react';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { loadSettings } from '../../lib/storage.js';

interface TemplateOption {
  id: string;
  label: string;
}

interface ExecuteTemplateResponse {
  success: boolean;
  reason?: 'hard-limit-exceeded' | 'not-found' | string;
}

function executeTemplate(
  templateId: string,
  text: string,
): Promise<ExecuteTemplateResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'execute-template',
        templateId,
        text,
      },
      (response: ExecuteTemplateResponse) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(runtimeError);
          return;
        }
        resolve(response ?? { success: false });
      },
    );
  });
}


function PopupApp(): JSX.Element {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [inputText, setInputText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    void loadSettings()
      .then((settings) => {
        if (!mounted) {
          return;
        }
        const enabledTemplates = settings.templates
          .filter((template) => template.enabled)
          .map((template) => ({ id: template.id, label: template.label }));
        setTemplates(enabledTemplates);
        setSelectedTemplateId(
          (current) => current || enabledTemplates[0]?.id || '',
        );
      })
      .catch((error) => {
        console.error(error);
        if (mounted) {
          setStatusMessage('設定の読み込みに失敗しました。');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const hasTemplates = templates.length > 0;
  const templateOptions = useMemo(() => templates, [templates]);
  const selectedTemplate = useMemo(
    () =>
      templateOptions.find((template) => template.id === selectedTemplateId),
    [templateOptions, selectedTemplateId],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatusMessage('');

      if (!selectedTemplateId) {
        setStatusMessage(
          'テンプレートが選択できません。オプションから有効化してください。',
        );
        return;
      }

      const trimmed = inputText.trim();
      if (!trimmed) {
        setStatusMessage('テキストを入力してください。');
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await executeTemplate(selectedTemplateId, trimmed);
        if (!response.success) {
          if (response.reason === 'hard-limit-exceeded') {
            setStatusMessage('URLが長すぎるためキャンセルしました。');
          } else if (response.reason === 'not-found') {
            setStatusMessage('テンプレートが見つかりません。');
          } else {
            setStatusMessage('実行中に問題が発生しました。');
          }
          return;
        }
        setStatusMessage('ChatGPT を開きました。');
      } catch (error) {
        console.error(error);
        setStatusMessage('実行中にエラーが発生しました。');
      } finally {
        setIsSubmitting(false);
      }
    },
    [inputText, selectedTemplateId],
  );

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    setStatusMessage('');
  }, []);

  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  return (
    <div className="min-h-full p-4 text-[#334155] bg-[radial-gradient(120%_140%_at_0%_0%,rgba(56,189,248,0.1),transparent),_radial-gradient(110%_120%_at_100%_0%,rgba(129,140,248,0.1),transparent),_linear-gradient(135deg,#ffffff,#f0f5ff)]">
      <div className="mx-auto flex w-full max-w-[320px] items-stretch gap-4 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-[18px] backdrop-blur-[20px] shadow-[0_30px_60px_-32px_rgba(15,23,42,0.3)] max-[520px]:flex-col max-[520px]:p-4">
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
              templateOptions.map((template) => {
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
                    onClick={() => handleTemplateSelect(template.id)}
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
            onClick={handleOpenOptions}
          >
            テンプレートを編集
          </button>
        </aside>

        <main className="flex flex-1 flex-col gap-[18px]">
          <section className="rounded-[22px] border border-[rgba(129,140,248,0.35)] bg-[linear-gradient(135deg,rgba(59,130,246,0.8),rgba(124,58,237,0.85))] p-[18px] shadow-[0_20px_40px_-24px_rgba(79,70,229,0.6)]">
            <div className="flex flex-col gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/80 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                Quick Prompt
              </span>
              <h1 className="text-[1.45rem] font-semibold text-white">
                ChatGPT Search
              </h1>
              <p className="mt-2 text-[13px] leading-[1.6] text-[rgba(226,232,240,0.9)]">
                選択テキストを即座にテンプレートへ差し込み、洗練されたプロンプトでChatGPTを呼び出します。
              </p>
            </div>
          </section>

          <form
            className="flex flex-col gap-4 rounded-[22px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.75)] p-5 backdrop-blur-[18px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_20px_35px_-32px_rgba(15,23,42,0.4)]"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[rgba(56,189,248,0.3)] bg-[rgba(56,189,248,0.15)] px-[14px] py-[10px]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#475569]">
                使用するテンプレート
              </p>
              <p className="text-[14px] font-semibold text-[#1e293b]">
                {selectedTemplate ? selectedTemplate.label : '未選択'}
              </p>
            </div>

            <label
              htmlFor="inputText"
              className="text-sm font-medium text-slate-600"
            >
              検索したいテキスト
            </label>
            <textarea
              id="inputText"
              className="min-h-36 w-full resize-y rounded-xl border border-border/70 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-[0_6px_18px_-12px_rgb(15_23_42/0.3)] transition duration-200 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="選択テキストを貼り付けてください"
              spellCheck={false}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              disabled={isLoading}
            />

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition duration-200 hover:shadow-indigo-500/40 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || !hasTemplates}
            >
              <span>{isSubmitting ? '送信中…' : 'ChatGPT を開く'}</span>
            </button>

            <p
              className="min-h-5 text-center text-sm text-slate-500"
              id="statusMessage"
            >
              {isLoading ? '設定を読み込み中…' : statusMessage}
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }
  const root = createRoot(container);
  root.render(<PopupApp />);
}

document.addEventListener('DOMContentLoaded', bootstrap);
