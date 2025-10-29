import type { FormEvent, JSX } from 'react';
import { ActionBar } from './components/ActionBar.js';
import { GeneralSettingsSection } from './components/GeneralSettingsSection.js';
import { OptionsHero } from './components/OptionsHero.js';
import { TemplateEditor } from './components/TemplateEditor.js';
import { TemplateList } from './components/TemplateList.js';
import { useOptionsController } from './hooks/useOptionsController.js';

export function OptionsApp(): JSX.Element {
  const {
    draft,
    selectedTemplateId,
    selectedTemplate,
    statusText,
    isLoading,
    isSaving,
    isResetting,
    isImporting,
    fileInputRef,
    handleTemplateChange,
    handleTemplateAdd,
    handleTemplateRemove,
    handleTemplateSelect,
    handleFieldChange,
    handleImportClick,
    handleImportFileChange,
    handleExport,
    handleSubmit,
    handleReset,
  } = useOptionsController();

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(event);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(160%_120%_at_10%_20%,rgba(56,189,248,0.12),transparent),_radial-gradient(100%_140%_at_90%_0%,rgba(129,140,248,0.16),transparent),_linear-gradient(180deg,#f5f7ff,#ffffff)] text-[#334155]">
      <main className="mx-auto w-full max-w-[1040px] px-5 pt-16 pb-20 sm:px-6 lg:px-8">
        <OptionsHero />
        {draft ? (
          <form id="settingsForm" className="mt-10" onSubmit={handleFormSubmit}>
            <div className="grid gap-7 xl:grid-cols-[minmax(260px,320px)_1fr]">
              <TemplateList
                templates={draft.templates}
                selectedTemplateId={selectedTemplateId}
                onSelect={handleTemplateSelect}
                onAdd={handleTemplateAdd}
              />

              <div className="flex min-w-0 flex-col gap-7">
                <GeneralSettingsSection
                  hardLimit={draft.hardLimit}
                  parentMenuTitle={draft.parentMenuTitle}
                  onHardLimitChange={(value) =>
                    handleFieldChange('hardLimit', value)
                  }
                  onParentMenuTitleChange={(value) =>
                    handleFieldChange('parentMenuTitle', value)
                  }
                />

                <section className="rounded-[28px]">
                  {selectedTemplate ? (
                    <TemplateEditor
                      template={selectedTemplate}
                      onChange={(updater) =>
                        handleTemplateChange(selectedTemplate.id, updater)
                      }
                      onRemove={handleTemplateRemove}
                    />
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-[rgba(129,140,248,0.6)] bg-[rgba(255,255,255,0.5)] p-9 text-center text-[14px] text-[#475569]">
                      テンプレートを左のリストから選択してください。
                    </div>
                  )}
                </section>

                <ActionBar
                  isLoading={isLoading}
                  statusText={statusText}
                  isSaving={isSaving}
                  isResetting={isResetting}
                  isImporting={isImporting}
                  onReset={() => {
                    void handleReset();
                  }}
                  onImport={handleImportClick}
                  onExport={handleExport}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(event) => {
                    void handleImportFileChange(event);
                  }}
                />
              </div>
            </div>
          </form>
        ) : (
          <section className="mt-10 flex flex-col gap-3 rounded-[24px] border border-[rgba(148,163,184,0.25)] bg-[rgba(255,255,255,0.6)] p-6 text-[#475569]">
            <p>
              {isLoading
                ? '設定を読み込み中…'
                : '設定を読み込めませんでした。ページを再読み込みしてください。'}
            </p>
            {statusText && (
              <p className="text-xs font-medium text-rose-600">{statusText}</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
