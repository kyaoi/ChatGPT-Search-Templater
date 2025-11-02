import type {
  ExecuteTemplateOverrides,
  ExecuteTemplateResponse,
  RuntimeMessage,
  SelectionResponsePayload,
  SendResponse,
} from '@shared/messages.js';
import {
  DEFAULT_SETTINGS,
  type ExtensionSettings,
  resolveModelId,
  type TemplateSettings,
} from '@shared/settings.js';
import { buildChatGPTUrl } from '@shared/urlBuilder.js';
import { ensureDefaults, observeSettings } from '../lib/storage.js';

interface ContextMenuClickInfo {
  menuItemId: string | number;
  selectionText?: string;
}

interface ChromeTab {
  id?: number;
}

interface RuntimeMessageSender {
  tab?: ChromeTab;
}

interface ScriptSelectionResult {
  text: string;
}

const MENU_PARENT_ID = 'chatgpt-search-templater:parent';
const MENU_EDIT_ID = 'chatgpt-search-templater:edit';
const MENU_PROMPT_ID = 'chatgpt-search-templater:prompt';
type ContextMenuContextList = [
  `${chrome.contextMenus.ContextType}`,
  ...`${chrome.contextMenus.ContextType}`[],
];

const SELECTION_CONTEXTS: ContextMenuContextList = ['selection'];

let currentSettings: ExtensionSettings = DEFAULT_SETTINGS;
let menuUpdateChain: Promise<void> = Promise.resolve();

function cloneTemplate(template: TemplateSettings): TemplateSettings {
  return {
    id: template.id,
    label: template.label,
    url: template.url,
    queryTemplate: template.queryTemplate,
    enabled: template.enabled,
    hintsSearch: template.hintsSearch,
    temporaryChat: template.temporaryChat,
    model: template.model,
    isDefault: template.isDefault,
    customModel: template.customModel,
  };
}

function snapshotSettings(settings: ExtensionSettings): ExtensionSettings {
  return {
    hardLimit: settings.hardLimit,
    parentMenuTitle: settings.parentMenuTitle,
    templates: settings.templates.map((template) => cloneTemplate(template)),
  };
}

function templateMenuId(templateId: string): string {
  return `chatgpt-search-templater:template:${templateId}`;
}

function isTemplateMenuId(menuId: string): boolean {
  return menuId.startsWith('chatgpt-search-templater:template:');
}

function parseTemplateId(menuId: string): string | null {
  if (!isTemplateMenuId(menuId)) {
    return null;
  }
  return menuId.replace('chatgpt-search-templater:template:', '');
}

function enqueueContextMenuUpdate(settings: ExtensionSettings): Promise<void> {
  const snapshot = snapshotSettings(settings);
  menuUpdateChain = menuUpdateChain
    .catch(() => undefined)
    .then(() => regenerateContextMenus(snapshot));
  return menuUpdateChain;
}

function regenerateContextMenus(settings: ExtensionSettings): Promise<void> {
  const removeMenus = (): Promise<void> =>
    new Promise((resolve) => {
      chrome.contextMenus.removeAll(() => {
        const error = chrome.runtime?.lastError;
        if (error && !/No menu/.test(error.message ?? '')) {
          console.warn('contextMenus.removeAll error:', error);
        }
        resolve();
      });
    });

  const createMenu = (
    options: chrome.contextMenus.CreateProperties,
  ): Promise<void> =>
    new Promise((resolve) => {
      chrome.contextMenus.create(options, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          console.warn('contextMenus.create error:', error, options);
        }
        resolve();
      });
    });

  return removeMenus().then(async () => {
    await createMenu({
      id: MENU_PARENT_ID,
      title: settings.parentMenuTitle,
      contexts: SELECTION_CONTEXTS,
    });

    const templateMenus = settings.templates
      .filter((template) => template.enabled)
      .map((template) =>
        createMenu({
          id: templateMenuId(template.id),
          parentId: MENU_PARENT_ID,
          title: template.label,
          contexts: SELECTION_CONTEXTS,
        }),
      );

    await Promise.all(templateMenus);

    await createMenu({
      id: MENU_PROMPT_ID,
      parentId: MENU_PARENT_ID,
      title: 'クエリを入力して実行…',
      contexts: SELECTION_CONTEXTS,
    });

    await createMenu({
      id: MENU_EDIT_ID,
      parentId: MENU_PARENT_ID,
      title: 'テンプレートを編集…',
      contexts: SELECTION_CONTEXTS,
    });
  });
}

async function showAlertOnTab(
  tabId: number | undefined,
  message: string,
): Promise<void> {
  if (typeof tabId !== 'number') {
    return;
  }
  await new Promise<void>((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'alert', message }, () => resolve());
  });
}

async function resolveSelectionText(
  tabId: number | undefined,
  fallback: string,
): Promise<string> {
  if (typeof tabId !== 'number') {
    return fallback;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      { type: 'get-selection' },
      (response?: SelectionResponsePayload) => {
        const error = chrome.runtime?.lastError;
        if (
          error ||
          !response ||
          typeof response.text !== 'string' ||
          response.text.length === 0
        ) {
          void fetchSelectionViaScripting(tabId)
            .then((scriptSelection) => {
              if (scriptSelection && scriptSelection.length > 0) {
                resolve(scriptSelection);
              } else {
                resolve(fallback);
              }
            })
            .catch(() => resolve(fallback));
          return;
        }
        resolve(response.text);
      },
    );
  });
}

async function fetchSelectionViaScripting(
  tabId: number,
): Promise<string | null> {
  if (!chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const results = await chrome.scripting.executeScript<
      [],
      ScriptSelectionResult
    >({
      target: { tabId, allFrames: true },
      world: 'ISOLATED',
      func: (): ScriptSelectionResult => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return { text: '' };
        }
        return { text: selection.toString() };
      },
    });

    for (const entry of results ?? []) {
      const text = entry?.result?.text;
      if (typeof text === 'string' && text.length > 0) {
        return text;
      }
    }
  } catch (error) {
    console.warn('fetchSelectionViaScripting error:', error);
  }

  return null;
}

interface PromptWindowParams {
  text?: string;
  templateId?: string;
}

function openPromptWindow(params: PromptWindowParams): Promise<void> {
  const pickerUrl = new URL(chrome.runtime.getURL('picker.html'));
  if (params.text && params.text.length > 0) {
    pickerUrl.searchParams.set('text', params.text);
  }
  if (params.templateId && params.templateId.length > 0) {
    pickerUrl.searchParams.set('templateId', params.templateId);
  }

  return new Promise((resolve) => {
    chrome.windows.create(
      {
        url: pickerUrl.toString(),
        type: 'popup',
        width: 520,
        height: 640,
        focused: true,
      },
      () => resolve(),
    );
  });
}

async function executeTemplate(
  template: TemplateSettings,
  selectionText: string,
  hardLimit: number,
  tabId?: number,
  overrides?: ExecuteTemplateOverrides,
): Promise<ExecuteTemplateResponse> {
  const runtimeOverrides = overrides?.runtime ?? {};
  const hintsSearch =
    typeof runtimeOverrides.hintsSearch === 'boolean'
      ? runtimeOverrides.hintsSearch
      : template.hintsSearch;
  const temporaryChat =
    typeof runtimeOverrides.temporaryChat === 'boolean'
      ? runtimeOverrides.temporaryChat
      : template.temporaryChat;

  const runtimeModelCandidate = runtimeOverrides.model?.trim() ?? '';
  const runtimeModel =
    runtimeModelCandidate.length > 0
      ? runtimeModelCandidate
      : resolveModelId(template);

  const { url } = buildChatGPTUrl({
    templateUrl: template.url,
    queryTemplate: template.queryTemplate,
    rawText: selectionText,
    runtimeOptions: {
      hintsSearch,
      temporaryChat,
      model: runtimeModel,
    },
  });

  if (url.length > hardLimit) {
    const message =
      '選択テキストが長すぎるため、URLに挿入できません。内容を短くするか、分割してください。';
    await showAlertOnTab(tabId, message);
    return { success: false, reason: 'hard-limit-exceeded' };
  }

  await new Promise<void>((resolve) => {
    chrome.tabs.create({ url }, () => resolve());
  });

  return { success: true };
}

function findTemplateById(
  settings: ExtensionSettings,
  templateId: string,
): TemplateSettings | undefined {
  return settings.templates.find((template) => template.id === templateId);
}

function findDefaultTemplate(
  settings: ExtensionSettings,
): TemplateSettings | undefined {
  return settings.templates.find(
    (template) => template.isDefault && template.enabled,
  );
}

async function bootstrap(): Promise<void> {
  currentSettings = await ensureDefaults();
  await enqueueContextMenuUpdate(currentSettings);
}

void bootstrap();

chrome.runtime.onInstalled.addListener(() => {
  void bootstrap();
});

chrome.runtime.onStartup.addListener(() => {
  void bootstrap();
});

observeSettings((settings) => {
  currentSettings = settings;
  void enqueueContextMenuUpdate(currentSettings);
});

chrome.contextMenus.onClicked.addListener(
  (info: ContextMenuClickInfo, tab?: ChromeTab) => {
    void (async () => {
      const menuId = String(info.menuItemId);

      if (menuId === MENU_EDIT_ID) {
        chrome.runtime.openOptionsPage();
        return;
      }

      if (menuId === MENU_PROMPT_ID) {
        const fallbackText = info.selectionText ?? '';
        const selectionText = await resolveSelectionText(tab?.id, fallbackText);
        const defaultTemplate =
          findDefaultTemplate(currentSettings) ??
          currentSettings.templates.find((template) => template.enabled);
        await openPromptWindow({
          text: selectionText,
          templateId: defaultTemplate?.id,
        });
        return;
      }

      const templateId = parseTemplateId(menuId);
      if (!templateId) {
        return;
      }

      const template = findTemplateById(currentSettings, templateId);
      if (!template) {
        return;
      }

      const fallbackText = info.selectionText ?? '';
      const selectionText = await resolveSelectionText(tab?.id, fallbackText);

      if (!selectionText) {
        void showAlertOnTab(
          tab?.id,
          'テキストを選択してから実行してください。',
        );
        return;
      }

      void executeTemplate(
        template,
        selectionText,
        currentSettings.hardLimit,
        tab?.id,
      );
    })();
  },
);

chrome.commands.onCommand.addListener((command) => {
  if (command === 'execute-default-template') {
    void (async () => {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const tabId = activeTab?.id;
      const defaultTemplate = findDefaultTemplate(currentSettings);
      if (!defaultTemplate) {
        await showAlertOnTab(
          tabId,
          '既定テンプレートが設定されていません。オプションページで設定してください。',
        );
        return;
      }

      const selectionText = await resolveSelectionText(tabId, '');
      if (!selectionText) {
        await showAlertOnTab(tabId, 'テキストを選択してから実行してください。');
        return;
      }

      await executeTemplate(
        defaultTemplate,
        selectionText,
        currentSettings.hardLimit,
        tabId,
      );
    })();
    return;
  }

  if (command === 'execute-default-template-with-prompt') {
    void (async () => {
      const [activeTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const tabId = activeTab?.id;
      const defaultTemplate = findDefaultTemplate(currentSettings);
      if (!defaultTemplate) {
        await showAlertOnTab(
          tabId,
          '既定テンプレートが設定されていません。オプションページで設定してください。',
        );
        return;
      }

      const selectionText = await resolveSelectionText(tabId, '');
      await openPromptWindow({
        text: selectionText,
        templateId: defaultTemplate.id,
      });
    })();
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: RuntimeMessage,
    sender: RuntimeMessageSender,
    sendResponse: SendResponse<ExecuteTemplateResponse>,
  ) => {
    if (message?.type === 'execute-template') {
      const template = findTemplateById(currentSettings, message.templateId);
      if (!template) {
        sendResponse({ success: false, reason: 'not-found' });
        return;
      }

      const originTabId = sender.tab?.id;
      executeTemplate(
        template,
        message.text,
        currentSettings.hardLimit,
        originTabId,
        message.overrides,
      )
        .then((result) => sendResponse(result))
        .catch(() =>
          sendResponse({ success: false, reason: 'unexpected-error' }),
        );
      return true;
    }
    return undefined;
  },
);
