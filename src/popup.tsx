import type { JSX } from 'react';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createRoot } from 'react-dom/client';
import { loadSettings } from './lib/storage.js';

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

  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  return (
    <div className="min-h-full bg-surface/70 px-4 py-5">
      <main className="surface-card relative w-[360px] max-w-full overflow-hidden px-5 pb-6 pt-5">
        <section className="gradient-header mb-6 rounded-2xl px-5 pb-6 pt-5">
          <div className="relative z-10 flex flex-col gap-3">
            <span className="chip w-fit bg-white/25 text-white/80">
              Quick Prompt
            </span>
            <h1 className="text-2xl font-semibold tracking-tight">
              ChatGPT Search
            </h1>
            <p className="text-sm text-white/70">
              選択テキストを即座にテンプレートへ差し込み、洗練されたプロンプトでChatGPTを呼び出します。
            </p>
          </div>
        </section>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <label htmlFor="inputText" className="field-label">
              検索したいテキスト
            </label>
            <textarea
              id="inputText"
              className="input-field min-h-36 resize-y"
              placeholder="選択テキストを貼り付けてください"
              spellCheck={false}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="templateSelect" className="field-label">
              テンプレートを選択
            </label>
            <select
              id="templateSelect"
              className="input-field appearance-none text-sm"
              value={hasTemplates ? selectedTemplateId : ''}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              disabled={!hasTemplates || isLoading}
            >
              {!hasTemplates ? (
                <option value="">有効なテンプレートがありません</option>
              ) : (
                templateOptions.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.label}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isSubmitting || !hasTemplates}
            >
              <span>{isSubmitting ? '送信中…' : 'ChatGPT を開く'}</span>
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={handleOpenOptions}
            >
              <span>テンプレートを編集</span>
            </button>
          </div>

          <p className="status-text min-h-5 text-center" id="statusMessage">
            {isLoading ? '設定を読み込み中…' : statusMessage}
          </p>
        </form>
      </main>
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
