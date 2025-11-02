import type { ExecuteTemplateOverrides } from '@shared/messages.js';
import type {
  TemplateModelOption,
  TemplateSettings,
} from '@shared/settings.js';
import { sharedSpec } from '@shared/spec.js';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { executeTemplate } from '../../../lib/runtimeMessaging.js';
import { loadSettings } from '../../../lib/storage.js';

interface UsePickerControllerParams {
  initialText: string;
  initialTemplateId?: string;
}

interface PickerState {
  templates: TemplateSettings[];
  selectedTemplateId: string;
  text: string;
  hintsSearch: boolean;
  temporaryChat: boolean;
  modelOption: TemplateModelOption;
  customModel: string;
  statusMessage: string;
  isLoading: boolean;
  isSubmitting: boolean;
}

const DEFAULT_MODEL: TemplateModelOption = 'gpt-5';

function resolveInitialTemplate(
  templates: TemplateSettings[],
  preferredId?: string,
): TemplateSettings | undefined {
  if (preferredId) {
    const byPreferred = templates.find(
      (template) => template.id === preferredId,
    );
    if (byPreferred) {
      return byPreferred;
    }
  }
  const byDefault = templates.find((template) => template.isDefault);
  if (byDefault) {
    return byDefault;
  }
  return templates[0];
}

export function usePickerController({
  initialText,
  initialTemplateId,
}: UsePickerControllerParams): {
  templates: TemplateSettings[];
  selectedTemplateId: string;
  text: string;
  setText: (value: string) => void;
  selectTemplate: (templateId: string) => void;
  hintsSearch: boolean;
  setHintsSearch: (value: boolean) => void;
  temporaryChat: boolean;
  setTemporaryChat: (value: boolean) => void;
  modelOption: TemplateModelOption;
  setModelOption: (value: TemplateModelOption) => void;
  customModel: string;
  setCustomModel: (value: string) => void;
  isLoading: boolean;
  isSubmitting: boolean;
  statusText: string;
  hasTemplates: boolean;
  modelOptions: readonly TemplateModelOption[];
  submit: () => Promise<boolean>;
} {
  const [state, setState] = useState<PickerState>({
    templates: [],
    selectedTemplateId: '',
    text: initialText,
    hintsSearch: false,
    temporaryChat: false,
    modelOption: DEFAULT_MODEL,
    customModel: '',
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

        const enabledTemplates = settings.templates.filter(
          (template) => template.enabled,
        );

        const initialTemplate = resolveInitialTemplate(
          enabledTemplates,
          initialTemplateId,
        );

        setState((current) => ({
          ...current,
          templates: enabledTemplates,
          selectedTemplateId: initialTemplate?.id ?? '',
          hintsSearch: initialTemplate?.hintsSearch ?? current.hintsSearch,
          temporaryChat:
            initialTemplate?.temporaryChat ?? current.temporaryChat,
          modelOption: initialTemplate?.model ?? current.modelOption,
          customModel:
            initialTemplate?.model === 'custom'
              ? (initialTemplate.customModel ?? '')
              : '',
          statusMessage:
            enabledTemplates.length === 0
              ? '有効なテンプレートがありません。オプションページで設定してください。'
              : '',
          isLoading: false,
        }));
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
  }, [initialTemplateId]);

  const templates = state.templates;
  const selectedTemplateId = state.selectedTemplateId;
  const text = state.text;
  const hintsSearch = state.hintsSearch;
  const temporaryChat = state.temporaryChat;
  const modelOption = state.modelOption;
  const customModel = state.customModel;
  const isLoading = state.isLoading;
  const isSubmitting = state.isSubmitting;
  const statusMessage = state.statusMessage;

  const hasTemplates = templates.length > 0;
  const modelOptions = useMemo(
    () => sharedSpec.templateModelOptions as readonly TemplateModelOption[],
    [],
  );

  const setText = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      text: value,
      statusMessage: '',
    }));
  }, []);

  const selectTemplate = useCallback((templateId: string) => {
    setState((current) => {
      const template = current.templates.find(
        (entry) => entry.id === templateId,
      );
      if (!template) {
        return {
          ...current,
          selectedTemplateId: templateId,
          statusMessage: '',
        };
      }
      return {
        ...current,
        selectedTemplateId: templateId,
        hintsSearch: template.hintsSearch,
        temporaryChat: template.temporaryChat,
        modelOption: template.model,
        customModel:
          template.model === 'custom' ? (template.customModel ?? '') : '',
        statusMessage: '',
      };
    });
  }, []);

  const setHintsSearch = useCallback((value: boolean) => {
    setState((current) => ({
      ...current,
      hintsSearch: value,
      statusMessage: '',
    }));
  }, []);

  const setTemporaryChat = useCallback((value: boolean) => {
    setState((current) => ({
      ...current,
      temporaryChat: value,
      statusMessage: '',
    }));
  }, []);

  const setModelOption = useCallback((value: TemplateModelOption) => {
    setState((current) => ({
      ...current,
      modelOption: value,
      customModel: value === 'custom' ? current.customModel : '',
      statusMessage: '',
    }));
  }, []);

  const setCustomModel = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      customModel: value,
      statusMessage: '',
    }));
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (!selectedTemplateId) {
      setState((current) => ({
        ...current,
        statusMessage:
          'テンプレートが選択できません。オプションから有効化してください。',
      }));
      return false;
    }

    const template = templates.find((entry) => entry.id === selectedTemplateId);
    if (!template) {
      setState((current) => ({
        ...current,
        statusMessage: 'テンプレートが見つかりません。',
      }));
      return false;
    }

    const trimmed = text.trim();
    if (!trimmed) {
      setState((current) => ({
        ...current,
        statusMessage: 'クエリを入力してください。',
      }));
      return false;
    }

    const runtimeModel =
      modelOption === 'custom' ? customModel.trim() : modelOption;

    if (modelOption === 'custom' && runtimeModel.length === 0) {
      setState((current) => ({
        ...current,
        statusMessage: 'カスタムモデル名を入力してください。',
      }));
      return false;
    }

    const overrides: ExecuteTemplateOverrides = {
      runtime: {
        hintsSearch,
        temporaryChat,
        model: runtimeModel,
      },
    };

    setState((current) => ({
      ...current,
      isSubmitting: true,
      statusMessage: '',
    }));

    try {
      const response = await executeTemplate(template.id, trimmed, overrides);
      if (!response.success) {
        const errorMessage =
          response.reason === 'hard-limit-exceeded'
            ? 'URLが長すぎるためキャンセルしました。'
            : response.reason === 'not-found'
              ? 'テンプレートが見つかりません。'
              : '実行中に問題が発生しました。';
        setState((current) => ({
          ...current,
          statusMessage: errorMessage,
        }));
        return false;
      }

      setState((current) => ({
        ...current,
        statusMessage: 'ChatGPT を開きました。',
      }));
      return true;
    } catch (error) {
      console.error(error);
      setState((current) => ({
        ...current,
        statusMessage: '実行中にエラーが発生しました。',
      }));
      return false;
    } finally {
      setState((current) => ({
        ...current,
        isSubmitting: false,
      }));
    }
  }, [
    selectedTemplateId,
    templates,
    text,
    modelOption,
    customModel,
    hintsSearch,
    temporaryChat,
  ]);

  const statusText = isLoading ? '設定を読み込み中…' : statusMessage;

  return {
    templates,
    selectedTemplateId,
    text,
    setText,
    selectTemplate,
    hintsSearch,
    setHintsSearch,
    temporaryChat,
    setTemporaryChat,
    modelOption,
    setModelOption,
    customModel,
    setCustomModel,
    isLoading,
    isSubmitting,
    statusText,
    hasTemplates,
    modelOptions,
    submit,
  };
}
