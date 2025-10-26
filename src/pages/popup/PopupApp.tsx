import type { FormEvent, JSX } from 'react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { loadSettings } from '../../lib/storage.js';
import { executeTemplate } from './api.js';
import { HeroSection } from './components/HeroSection.js';
import { PromptForm } from './components/PromptForm.js';
import { TemplateListPanel } from './components/TemplateListPanel.js';
import type { TemplateOption } from './types.js';

export function PopupApp(): JSX.Element {
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

  const templateOptions = useMemo(() => templates, [templates]);
  const selectedTemplate = useMemo(
    () =>
      templateOptions.find((template) => template.id === selectedTemplateId) ??
      null,
    [templateOptions, selectedTemplateId],
  );
  const hasTemplates = templateOptions.length > 0;

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

  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
  }, []);

  const handleOpenOptions = useCallback(() => {
    chrome.runtime.openOptionsPage();
  }, []);

  const statusText = isLoading ? '設定を読み込み中…' : statusMessage;

  return (
    <div className="min-h-full bg-[radial-gradient(120%_140%_at_0%_0%,rgba(56,189,248,0.1),transparent),_radial-gradient(110%_120%_at_100%_0%,rgba(129,140,248,0.1),transparent),_linear-gradient(135deg,#ffffff,#f0f5ff)] p-4 text-[#334155]">
      <div className="mx-auto flex w-full max-w-[320px] items-stretch gap-4 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-[18px] backdrop-blur-[20px] shadow-[0_30px_60px_-32px_rgba(15,23,42,0.3)] max-[520px]:flex-col max-[520px]:p-4">
        <TemplateListPanel
          templates={templateOptions}
          selectedTemplateId={selectedTemplateId}
          onSelect={handleTemplateSelect}
          isLoading={isLoading}
          onOpenOptions={handleOpenOptions}
        />

        <main className="flex flex-1 flex-col gap-[18px]">
          <HeroSection />
          <PromptForm
            selectedTemplateLabel={selectedTemplate?.label ?? null}
            inputText={inputText}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            hasTemplates={hasTemplates}
            isLoading={isLoading}
            statusText={statusText}
          />
        </main>
      </div>
    </div>
  );
}
