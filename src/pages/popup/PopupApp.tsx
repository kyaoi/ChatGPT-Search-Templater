import type { FormEvent, JSX } from 'react';
import { useCallback } from 'react';
import { HeroSection } from './components/HeroSection.js';
import { PromptForm } from './components/PromptForm.js';
import { TemplateListPanel } from './components/TemplateListPanel.js';
import { usePopupController } from './hooks/usePopupController.js';

export function PopupApp(): JSX.Element {
  const {
    templates,
    selectedTemplateId,
    selectedTemplate: activeTemplate,
    inputText,
    statusText,
    isLoading,
    isSubmitting,
    hasTemplates,
    setInputText,
    selectTemplate,
    submit,
    openOptionsPage,
  } = usePopupController();

  const templateOptions = templates;

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await submit();
    },
    [submit],
  );

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      selectTemplate(templateId);
    },
    [selectTemplate],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputText(value);
    },
    [setInputText],
  );

  const handleOpenOptions = useCallback(() => {
    openOptionsPage();
  }, [openOptionsPage]);

  return (
    <div className="min-h-full w-full bg-[radial-gradient(140%_120%_at_10%_10%,rgba(56,189,248,0.12),transparent),_radial-gradient(120%_140%_at_90%_0%,rgba(129,140,248,0.14),transparent),_linear-gradient(135deg,#f7f9ff,#eef2ff)] px-4 py-5 text-[#334155] sm:px-6">
      <div className="mx-auto flex w-full min-w-[360px] max-w-[640px] flex-col gap-5 rounded-[28px] border border-[rgba(148,163,184,0.22)] bg-[rgba(255,255,255,0.9)] p-5 shadow-[0_28px_70px_-42px_rgba(15,23,42,0.55)] backdrop-blur-[24px] sm:gap-6 sm:p-6 md:max-w-[760px] lg:max-w-[820px]">
        <div className="grid w-full gap-5 md:grid-cols-[minmax(240px,280px)_1fr] md:items-start">
          <TemplateListPanel
            templates={templateOptions}
            selectedTemplateId={selectedTemplateId}
            onSelect={handleTemplateSelect}
            isLoading={isLoading}
            onOpenOptions={handleOpenOptions}
          />

          <main className="flex min-w-0 flex-col gap-5">
            <HeroSection />
            <PromptForm
              selectedTemplateLabel={activeTemplate?.label ?? null}
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
    </div>
  );
}
