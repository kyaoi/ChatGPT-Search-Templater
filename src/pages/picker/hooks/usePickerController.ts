import type { ExecuteTemplateOverrides } from '@shared/messages.js';
import type { TemplateModelOption } from '@shared/settings.js';
import { models, sharedSpec } from '@shared/spec.js';
import { useCallback, useMemo, useState } from 'react';
import { executeTemplate } from '../../../lib/runtimeMessaging.js';

interface UsePickerControllerParams {
  initialText: string;
}

interface PickerState {
  text: string;
  templateUrl: string;
  queryTemplate: string;
  hintsSearch: boolean;
  temporaryChat: boolean;
  modelOption: TemplateModelOption;
  customModel: string;
  statusMessage: string;
  isSubmitting: boolean;
}

const BLUEPRINT = sharedSpec.defaultTemplates[0];
const DEFAULT_TEMPLATE_URL = BLUEPRINT?.url ?? sharedSpec.defaultTemplateUrl;
const DEFAULT_QUERY_TEMPLATE =
  BLUEPRINT?.queryTemplate ?? sharedSpec.defaultQueryTemplate;
const DEFAULT_HINTS_SEARCH = BLUEPRINT?.hintsSearch ?? false;
const DEFAULT_TEMPORARY_CHAT = BLUEPRINT?.temporaryChat ?? false;
const DEFAULT_MODEL_OPTION = (BLUEPRINT?.model ??
  models[0]) as TemplateModelOption;
const DEFAULT_CUSTOM_MODEL = BLUEPRINT?.customModel ?? '';

export function usePickerController({
  initialText,
}: UsePickerControllerParams): {
  text: string;
  setText: (value: string) => void;
  templateUrl: string;
  setTemplateUrl: (value: string) => void;
  queryTemplate: string;
  setQueryTemplate: (value: string) => void;
  hintsSearch: boolean;
  setHintsSearch: (value: boolean) => void;
  temporaryChat: boolean;
  setTemporaryChat: (value: boolean) => void;
  modelOption: TemplateModelOption;
  setModelOption: (value: TemplateModelOption) => void;
  customModel: string;
  setCustomModel: (value: string) => void;
  isSubmitting: boolean;
  statusText: string;
  modelOptions: readonly TemplateModelOption[];
  submit: () => Promise<boolean>;
} {
  const [state, setState] = useState<PickerState>({
    text: initialText,
    templateUrl: DEFAULT_TEMPLATE_URL,
    queryTemplate: DEFAULT_QUERY_TEMPLATE,
    hintsSearch: DEFAULT_HINTS_SEARCH,
    temporaryChat: DEFAULT_TEMPORARY_CHAT,
    modelOption: DEFAULT_MODEL_OPTION,
    customModel: DEFAULT_CUSTOM_MODEL,
    statusMessage: '',
    isSubmitting: false,
  });

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

  const setTemplateUrl = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      templateUrl: value,
      statusMessage: '',
    }));
  }, []);

  const setQueryTemplate = useCallback((value: string) => {
    setState((current) => ({
      ...current,
      queryTemplate: value,
      statusMessage: '',
    }));
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
    const trimmedQuery = state.text.trim();
    if (!trimmedQuery) {
      setState((current) => ({
        ...current,
        statusMessage: 'クエリを入力してください。',
      }));
      return false;
    }

    const trimmedTemplateUrl = state.templateUrl.trim();
    if (!trimmedTemplateUrl) {
      setState((current) => ({
        ...current,
        statusMessage: 'テンプレートURLを入力してください。',
      }));
      return false;
    }

    const trimmedQueryTemplate = state.queryTemplate.trim();
    if (!trimmedQueryTemplate) {
      setState((current) => ({
        ...current,
        statusMessage: 'クエリテンプレートを入力してください。',
      }));
      return false;
    }

    const trimmedCustomModel =
      state.modelOption === 'custom' ? state.customModel.trim() : '';
    if (state.modelOption === 'custom' && trimmedCustomModel.length === 0) {
      setState((current) => ({
        ...current,
        statusMessage: 'カスタムモデル名を入力してください。',
      }));
      return false;
    }

    const inlineTemplate = {
      url: trimmedTemplateUrl,
      queryTemplate: trimmedQueryTemplate,
      hintsSearch: state.hintsSearch,
      temporaryChat: state.temporaryChat,
      model: state.modelOption,
      ...(state.modelOption === 'custom' && trimmedCustomModel.length > 0
        ? { customModel: trimmedCustomModel }
        : {}),
    };

    const overrides: ExecuteTemplateOverrides = {
      templateUrl: trimmedTemplateUrl,
      queryTemplate: trimmedQueryTemplate,
      runtime: {
        hintsSearch: state.hintsSearch,
        temporaryChat: state.temporaryChat,
        model:
          state.modelOption === 'custom'
            ? trimmedCustomModel
            : state.modelOption,
      },
    };

    setState((current) => ({
      ...current,
      isSubmitting: true,
      statusMessage: '',
    }));

    try {
      const response = await executeTemplate({
        text: trimmedQuery,
        inlineTemplate,
        overrides,
      });
      if (!response.success) {
        const errorMessage =
          response.reason === 'hard-limit-exceeded'
            ? 'URLが長すぎるためキャンセルしました。'
            : response.reason === 'not-found'
              ? '実行設定を準備できませんでした。'
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
  }, [state]);

  const statusText = state.statusMessage;

  return {
    text: state.text,
    setText,
    templateUrl: state.templateUrl,
    setTemplateUrl,
    queryTemplate: state.queryTemplate,
    setQueryTemplate,
    hintsSearch: state.hintsSearch,
    setHintsSearch,
    temporaryChat: state.temporaryChat,
    setTemporaryChat,
    modelOption: state.modelOption,
    setModelOption,
    customModel: state.customModel,
    setCustomModel,
    isSubmitting: state.isSubmitting,
    statusText,
    modelOptions,
    submit,
  };
}
