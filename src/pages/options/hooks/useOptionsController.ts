import {
  collectTemplateWarnings,
  createTemplateDefaults,
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  normalizeSettings,
} from '@shared/settings.js';
import {
  type ChangeEvent,
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { loadSettings, saveSettings } from '../../../lib/storage.js';
import {
  ensureTemplateSelection,
  getSelectedTemplate,
  settingsAdapter,
  updateTemplateDraft,
} from '../draftAdapter.js';
import type {
  SettingsDraft,
  TemplateDraft,
  TemplateUpdater,
} from '../types.js';

interface OptionsControllerState {
  draft: SettingsDraft | null;
  selectedTemplateId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isResetting: boolean;
  isImporting: boolean;
  dirty: boolean;
  statusMessage: string;
  loadingError: string | null;
}

function ensureSingleDraftDefault(
  templates: TemplateDraft[],
  preferredId?: string | null,
): TemplateDraft[] {
  if (templates.length === 0) {
    return templates;
  }

  let defaultIndex = templates.findIndex((template) => template.isDefault);

  if (preferredId) {
    const preferredIndex = templates.findIndex(
      (template) => template.id === preferredId,
    );
    if (preferredIndex !== -1) {
      defaultIndex = preferredIndex;
    }
  }

  if (defaultIndex === -1) {
    const firstEnabledIndex = templates.findIndex(
      (template) => template.enabled,
    );
    defaultIndex = firstEnabledIndex !== -1 ? firstEnabledIndex : 0;
  }

  return templates.map((template, index) => ({
    ...template,
    isDefault: index === defaultIndex,
  }));
}

export function useOptionsController(): {
  draft: SettingsDraft | null;
  selectedTemplateId: string | null;
  selectedTemplate: TemplateDraft | null;
  statusText: string;
  isLoading: boolean;
  isSaving: boolean;
  isResetting: boolean;
  isImporting: boolean;
  dirty: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleTemplateChange: (templateId: string, updater: TemplateUpdater) => void;
  handleTemplateAdd: () => void;
  handleTemplateRemove: (templateId: string) => void;
  handleTemplateSelect: (templateId: string) => void;
  handleFieldChange: (
    key: 'hardLimit' | 'parentMenuTitle',
    value: string,
  ) => void;
  handleImportClick: () => void;
  handleImportFileChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  handleExport: () => void;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  handleReset: () => Promise<void>;
  handleTemplateSetDefault: (templateId: string) => void;
} {
  const [state, setState] = useState<OptionsControllerState>({
    draft: null,
    selectedTemplateId: null,
    isLoading: true,
    isSaving: false,
    isResetting: false,
    isImporting: false,
    dirty: false,
    statusMessage: '',
    loadingError: null,
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const settings = await loadSettings();
        if (!mounted) {
          return;
        }
        const draft = settingsAdapter.toDraft(settings);
        const normalizedDraft: SettingsDraft = {
          ...draft,
          templates: ensureSingleDraftDefault(draft.templates),
        };
        setState((current) => ({
          ...current,
          draft: normalizedDraft,
          selectedTemplateId: ensureTemplateSelection(normalizedDraft, null),
          isLoading: false,
          dirty: false,
          statusMessage: '',
          loadingError: null,
        }));
      } catch (error) {
        console.error(error);
        if (mounted) {
          setState((current) => ({
            ...current,
            loadingError: '設定の読み込みに失敗しました。',
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

  const markDirty = useCallback(() => {
    setState((current) => ({
      ...current,
      dirty: true,
      statusMessage: '',
    }));
  }, []);

  const patchState = useCallback(
    (updater: (next: OptionsControllerState) => OptionsControllerState) => {
      setState((current) => updater(current));
    },
    [],
  );

  const handleTemplateChange = useCallback(
    (templateId: string, updater: TemplateUpdater) => {
      patchState((current) => {
        const nextDraft = updateTemplateDraft(
          current.draft,
          templateId,
          updater,
        );
        return {
          ...current,
          draft: nextDraft
            ? {
                ...nextDraft,
                templates: ensureSingleDraftDefault(nextDraft.templates),
              }
            : nextDraft,
        };
      });
      markDirty();
    },
    [markDirty, patchState],
  );

  const handleTemplateAdd = useCallback(() => {
    const newTemplate = createTemplateDefaults();
    const draftTemplate: TemplateDraft = {
      ...newTemplate,
      customModel: newTemplate.customModel ?? '',
    };
    patchState((current) => {
      if (!current.draft) {
        return current;
      }
      const nextTemplates = ensureSingleDraftDefault([
        ...current.draft.templates,
        draftTemplate,
      ]);
      const nextDraft: SettingsDraft = {
        ...current.draft,
        templates: nextTemplates,
      };
      return {
        ...current,
        draft: nextDraft,
        selectedTemplateId: draftTemplate.id,
      };
    });
    markDirty();
  }, [markDirty, patchState]);

  const handleTemplateRemove = useCallback(
    (templateId: string) => {
      patchState((current) => {
        if (!current.draft) {
          return current;
        }

        const nextTemplates = current.draft.templates.filter(
          (template) => template.id !== templateId,
        );
        if (nextTemplates.length === current.draft.templates.length) {
          return current;
        }

        const normalizedTemplates = ensureSingleDraftDefault(nextTemplates);
        const nextDraft: SettingsDraft = {
          ...current.draft,
          templates: normalizedTemplates,
        };
        const nextSelected = ensureTemplateSelection(
          nextDraft,
          current.selectedTemplateId === templateId
            ? null
            : current.selectedTemplateId,
        );

        return {
          ...current,
          draft: nextDraft,
          selectedTemplateId: nextSelected,
        };
      });
      markDirty();
    },
    [markDirty, patchState],
  );

  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      patchState((current) => ({
        ...current,
        selectedTemplateId: templateId,
        statusMessage: '',
      }));
    },
    [patchState],
  );

  const handleTemplateSetDefault = useCallback(
    (templateId: string) => {
      patchState((current) => {
        if (!current.draft) {
          return current;
        }
        const templates = ensureSingleDraftDefault(
          current.draft.templates,
          templateId,
        ).map((template) =>
          template.id === templateId
            ? {
                ...template,
                enabled: true,
              }
            : template,
        );
        const nextDraft: SettingsDraft = {
          ...current.draft,
          templates,
        };
        return {
          ...current,
          draft: nextDraft,
          selectedTemplateId: ensureTemplateSelection(
            nextDraft,
            current.selectedTemplateId,
          ),
        };
      });
      markDirty();
    },
    [markDirty, patchState],
  );

  const handleFieldChange = useCallback(
    (key: 'hardLimit' | 'parentMenuTitle', value: string) => {
      patchState((current) => {
        if (!current.draft) {
          return current;
        }
        return {
          ...current,
          draft: {
            ...current.draft,
            [key]: value,
          },
        };
      });
      markDirty();
    },
    [markDirty, patchState],
  );

  const handleExport = useCallback(() => {
    const { draft } = state;
    if (!draft) {
      return;
    }

    try {
      const normalized = settingsAdapter.fromDraft(draft);
      const exportData = {
        ...normalized,
        templates: normalized.templates.map(({ isDefault, ...rest }) => ({
          ...rest,
          default: isDefault,
        })),
      };
      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatgpt-search-templater-settings-${timestamp}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      patchState((current) => ({
        ...current,
        statusMessage: '設定をエクスポートしました。',
        loadingError: null,
      }));
    } catch (error) {
      console.error(error);
      window.alert('設定のエクスポートに失敗しました。');
    }
  }, [patchState, state]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) {
        return;
      }

      patchState((current) => ({
        ...current,
        isImporting: true,
      }));

      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const normalized = normalizeSettings(
          parsed as Partial<ExtensionSettings>,
        );
        const nextDraft = settingsAdapter.toDraft(normalized);
        const normalizedDraft: SettingsDraft = {
          ...nextDraft,
          templates: ensureSingleDraftDefault(nextDraft.templates),
        };

        patchState((current) => ({
          ...current,
          draft: normalizedDraft,
          selectedTemplateId: ensureTemplateSelection(normalizedDraft, null),
          dirty: true,
          statusMessage: '設定をインポートしました。保存して適用してください。',
          loadingError: null,
        }));
      } catch (error) {
        console.error(error);
        window.alert(
          '設定ファイルの読み込みに失敗しました。JSON形式のファイルを指定してください。',
        );
      } finally {
        patchState((current) => ({
          ...current,
          isImporting: false,
        }));
      }
    },
    [patchState],
  );

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      const { draft } = state;
      if (!draft) {
        return;
      }

      const normalized = settingsAdapter.fromDraft(draft);
      const hasPlaceholderWarning = normalized.templates.some(
        (template) => collectTemplateWarnings(template).length > 0,
      );

      if (hasPlaceholderWarning) {
        const proceed = window.confirm(
          'プレースホルダを含まないテンプレートがあります。このまま保存してもよろしいですか？',
        );
        if (!proceed) {
          return;
        }
      }

      patchState((current) => ({
        ...current,
        isSaving: true,
      }));

      try {
        await saveSettings(normalized);
        const nextDraft = settingsAdapter.toDraft(normalized);
        const normalizedDraft: SettingsDraft = {
          ...nextDraft,
          templates: ensureSingleDraftDefault(nextDraft.templates),
        };
        patchState((current) => ({
          ...current,
          draft: normalizedDraft,
          selectedTemplateId: ensureTemplateSelection(
            normalizedDraft,
            current.selectedTemplateId,
          ),
          dirty: false,
          statusMessage: '保存しました。',
          loadingError: null,
        }));
      } catch (error) {
        console.error(error);
        window.alert('保存に失敗しました。もう一度お試しください。');
      } finally {
        patchState((current) => ({
          ...current,
          isSaving: false,
        }));
      }
    },
    [patchState, state],
  );

  const handleReset = useCallback(async () => {
    const { draft } = state;
    if (!draft) {
      return;
    }
    const confirmed = window.confirm(
      '初期設定に戻しますか？保存されているテンプレートは上書きされます。',
    );
    if (!confirmed) {
      return;
    }

    patchState((current) => ({
      ...current,
      isResetting: true,
    }));

    try {
      const normalizedDefaults = normalizeSettings(DEFAULT_SETTINGS);
      await saveSettings(normalizedDefaults);
      const defaultDraft = settingsAdapter.toDraft(normalizedDefaults);
      const normalizedDraft: SettingsDraft = {
        ...defaultDraft,
        templates: ensureSingleDraftDefault(defaultDraft.templates),
      };
      patchState((current) => ({
        ...current,
        draft: normalizedDraft,
        selectedTemplateId: ensureTemplateSelection(normalizedDraft, null),
        dirty: false,
        statusMessage: '初期設定に戻しました。',
        loadingError: null,
      }));
    } catch (error) {
      console.error(error);
      window.alert('初期設定へのリセットに失敗しました。');
    } finally {
      patchState((current) => ({
        ...current,
        isResetting: false,
      }));
    }
  }, [patchState, state]);

  const selectedTemplate = useMemo(
    () => getSelectedTemplate(state.draft, state.selectedTemplateId),
    [state.draft, state.selectedTemplateId],
  );

  const statusText =
    state.loadingError ??
    (state.statusMessage
      ? state.statusMessage
      : state.dirty
        ? '未保存の変更があります。'
        : '');

  return {
    draft: state.draft,
    selectedTemplateId: state.selectedTemplateId,
    selectedTemplate,
    statusText,
    isLoading: state.isLoading,
    isSaving: state.isSaving,
    isResetting: state.isResetting,
    isImporting: state.isImporting,
    dirty: state.dirty,
    fileInputRef,
    handleTemplateChange,
    handleTemplateAdd,
    handleTemplateRemove,
    handleTemplateSelect,
    handleTemplateSetDefault,
    handleFieldChange,
    handleImportClick,
    handleImportFileChange,
    handleExport,
    handleSubmit,
    handleReset,
  };
}
