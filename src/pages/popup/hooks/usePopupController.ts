import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadSettings } from '../../../lib/storage.js';
import { executeTemplate } from '../api.js';
import type { TemplateOption } from '../types.js';

interface PopupControllerState {
  templates: TemplateOption[];
  selectedTemplateId: string;
  inputText: string;
  statusMessage: string;
  isLoading: boolean;
  isSubmitting: boolean;
}

interface SubmitContext {
  onSuccess?: () => void;
}

export function usePopupController(): {
  templates: TemplateOption[];
  selectedTemplateId: string;
  selectedTemplate: TemplateOption | null;
  inputText: string;
  statusText: string;
  isLoading: boolean;
  isSubmitting: boolean;
  hasTemplates: boolean;
  setInputText: (value: string) => void;
  selectTemplate: (templateId: string) => void;
  submit: (textOverride?: string, context?: SubmitContext) => Promise<void>;
  setStatusMessage: (message: string) => void;
  openOptionsPage: () => void;
} {
  const [
    {
      templates,
      selectedTemplateId,
      inputText,
      statusMessage,
      isLoading,
      isSubmitting,
    },
    setState,
  ] = useState<PopupControllerState>({
    templates: [],
    selectedTemplateId: '',
    inputText: '',
    statusMessage: '',
    isLoading: true,
    isSubmitting: false,
  });

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const settings = await loadSettings();
        if (!mounted) {
          return;
        }
        const enabledTemplates = settings.templates
          .filter((template) => template.enabled)
          .map((template) => ({
            id: template.id,
            label: template.label,
            isDefault: template.isDefault,
          }));

        setState((current) => {
          const nextSelectedId =
            current.selectedTemplateId ||
            enabledTemplates.find((template) => template.isDefault)?.id ||
            enabledTemplates[0]?.id ||
            '';
          return {
            ...current,
            templates: enabledTemplates,
            selectedTemplateId: nextSelectedId,
            isLoading: false,
          };
        });
      } catch (error) {
        console.error(error);
        if (mounted) {
          setState((current) => ({
            ...current,
            statusMessage: '設定の読み込みに失敗しました。',
            isLoading: false,
          }));
        }
      }
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const setStatusMessage = useCallback((message: string) => {
    setState((current) => ({
      ...current,
      statusMessage: message,
    }));
  }, []);

  const setInputText = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      inputText: value,
    }));
  }, []);

  const selectTemplate = useCallback((templateId: string) => {
    setState((current) => ({
      ...current,
      selectedTemplateId: templateId,
      statusMessage: '',
    }));
  }, []);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => template.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId],
  );

  const hasTemplates = templates.length > 0;

  const submit = useCallback(
    async (textOverride?: string, context?: SubmitContext) => {
      setState((current) => ({
        ...current,
        statusMessage: '',
      }));

      const effectiveTemplateId = selectedTemplateId;
      if (!effectiveTemplateId) {
        setState((current) => ({
          ...current,
          statusMessage:
            'テンプレートが選択できません。オプションから有効化してください。',
        }));
        return;
      }

      const rawText =
        typeof textOverride === 'string' ? textOverride : inputText;
      const trimmed = rawText.trim();
      if (!trimmed) {
        setState((current) => ({
          ...current,
          statusMessage: 'テキストを入力してください。',
        }));
        return;
      }

      setState((current) => ({
        ...current,
        isSubmitting: true,
      }));

      try {
        const response = await executeTemplate(effectiveTemplateId, trimmed);
        if (!response.success) {
          const nextMessage =
            response.reason === 'hard-limit-exceeded'
              ? 'URLが長すぎるためキャンセルしました。'
              : response.reason === 'not-found'
                ? 'テンプレートが見つかりません。'
                : '実行中に問題が発生しました。';

          setState((current) => ({
            ...current,
            statusMessage: nextMessage,
          }));
          return;
        }

        setState((current) => ({
          ...current,
          statusMessage: 'ChatGPT を開きました。',
        }));

        context?.onSuccess?.();
      } catch (error) {
        console.error(error);
        setState((current) => ({
          ...current,
          statusMessage: '実行中にエラーが発生しました。',
        }));
      } finally {
        setState((current) => ({
          ...current,
          isSubmitting: false,
        }));
      }
    },
    [inputText, selectedTemplateId],
  );

  const openOptionsPage = useCallback(() => {
    if (typeof chrome?.runtime?.openOptionsPage === 'function') {
      chrome.runtime.openOptionsPage();
    }
  }, []);

  const statusText = isLoading ? '設定を読み込み中…' : statusMessage;

  return {
    templates,
    selectedTemplateId,
    selectedTemplate,
    inputText,
    statusText,
    isLoading,
    isSubmitting,
    hasTemplates,
    setInputText,
    selectTemplate,
    submit,
    setStatusMessage,
    openOptionsPage,
  };
}
