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
    <div className="popup-wrapper">
      <div className="popup-shell">
        <aside className="popup-sidebar">
          <div className="popup-sidebar__heading">
            <p className="sidebar-caption">テンプレート</p>
            <h2>クイックリスト</h2>
            <p className="sidebar-description">
              使用したいテンプレートを選んでください。
            </p>
          </div>
          <div className="template-list" role="list">
            {!hasTemplates ? (
              <p className="template-list__empty">
                有効なテンプレートがありません。
              </p>
            ) : (
              templateOptions.map((template) => {
                const active = template.id === selectedTemplateId;
                return (
                  <button
                    type="button"
                    key={template.id}
                    className={`template-list__item ${
                      active ? 'is-active' : ''
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
            className="sidebar-manage"
            onClick={handleOpenOptions}
          >
            テンプレートを編集
          </button>
        </aside>

        <main className="popup-main">
          <section className="popup-hero">
            <div className="popup-hero__content">
              <span className="chip">Quick Prompt</span>
              <h1>ChatGPT Search</h1>
              <p>
                選択テキストを即座にテンプレートへ差し込み、洗練されたプロンプトでChatGPTを呼び出します。
              </p>
            </div>
          </section>

          <form className="popup-form" onSubmit={handleSubmit}>
            <div className="selected-template">
              <p className="selected-template__label">使用するテンプレート</p>
              <p className="selected-template__value">
                {selectedTemplate ? selectedTemplate.label : '未選択'}
              </p>
            </div>

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

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isSubmitting || !hasTemplates}
            >
              <span>{isSubmitting ? '送信中…' : 'ChatGPT を開く'}</span>
            </button>

            <p className="status-text min-h-5 text-center" id="statusMessage">
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
