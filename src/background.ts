import { buildChatGPTUrl } from './lib/urlBuilder.js';
import { DEFAULT_SETTINGS, ExtensionSettings, TemplateSettings, resolveModelId } from './lib/settings.js';
import { ensureDefaults, observeSettings } from './lib/storage.js';

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

type SendResponse = (response: { success: boolean; reason?: string }) => void;

interface SelectionResponsePayload {
  text?: string;
}

interface ExecuteTemplateMessage {
  type: 'execute-template';
  templateId: string;
  text: string;
}

type RuntimeMessage = ExecuteTemplateMessage;

const MENU_PARENT_ID = 'chatgpt-search-templater:parent';
const MENU_EDIT_ID = 'chatgpt-search-templater:edit';

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

  const createMenu = (options: { id?: string; parentId?: string | number; title?: string; contexts?: string[] }): Promise<void> =>
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
      contexts: ['selection'],
    });

    const templateMenus = settings.templates
      .filter((template) => template.enabled)
      .map((template) =>
        createMenu({
          id: templateMenuId(template.id),
          parentId: MENU_PARENT_ID,
          title: template.label,
          contexts: ['selection'],
        }),
      );

    await Promise.all(templateMenus);

    await createMenu({
      id: MENU_EDIT_ID,
      parentId: MENU_PARENT_ID,
      title: 'テンプレートを編集…',
      contexts: ['selection'],
    });
  });
}

async function showAlertOnTab(tabId: number | undefined, message: string): Promise<void> {
  if (typeof tabId !== 'number') {
    return;
  }
  await new Promise<void>((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'alert', message }, () => resolve());
  });
}

async function resolveSelectionText(tabId: number | undefined, fallback: string): Promise<string> {
  if (typeof tabId !== 'number') {
    return fallback;
  }

  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, { type: 'get-selection' }, (response?: SelectionResponsePayload) => {
      const error = chrome.runtime?.lastError;
      if (error || !response || typeof response.text !== 'string' || response.text.length === 0) {
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
    });
  });
}

async function fetchSelectionViaScripting(tabId: number): Promise<string | null> {
  if (!chrome.scripting?.executeScript) {
    return null;
  }

  try {
    const results = (await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      world: 'ISOLATED',
      func: () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
          return { text: '' };
        }
        return { text: selection.toString() };
      },
    })) as Array<{ result?: { text?: string } } | undefined>;

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

async function executeTemplate(
  template: TemplateSettings,
  selectionText: string,
  hardLimit: number,
  tabId?: number,
): Promise<{ success: boolean; reason?: string }> {
  const runtimeModel = resolveModelId(template);
  const { url } = buildChatGPTUrl({
    templateUrl: template.url,
    queryTemplate: template.queryTemplate,
    rawText: selectionText,
    runtimeOptions: {
      hintsSearch: template.hintsSearch,
      temporaryChat: template.temporaryChat,
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

function findTemplateById(settings: ExtensionSettings, templateId: string): TemplateSettings | undefined {
  return settings.templates.find((template) => template.id === templateId);
}

async function bootstrap(): Promise<void> {
  currentSettings = await ensureDefaults();
  await enqueueContextMenuUpdate(currentSettings);
}

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

chrome.contextMenus.onClicked.addListener((info: ContextMenuClickInfo, tab?: ChromeTab) => {
  void (async () => {
    const menuId = String(info.menuItemId);

    if (menuId === MENU_EDIT_ID) {
      chrome.runtime.openOptionsPage();
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
      void showAlertOnTab(tab?.id, 'テキストを選択してから実行してください。');
      return;
    }

    void executeTemplate(template, selectionText, currentSettings.hardLimit, tab?.id);
  })();
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender: RuntimeMessageSender, sendResponse: SendResponse) => {
  if (message?.type === 'execute-template') {
    const template = findTemplateById(currentSettings, message.templateId);
    if (!template) {
      sendResponse({ success: false, reason: 'not-found' });
      return;
    }

    const originTabId = sender.tab?.id;
    executeTemplate(template, message.text, currentSettings.hardLimit, originTabId)
      .then((result) => sendResponse(result))
      .catch(() => sendResponse({ success: false, reason: 'unexpected-error' }));
    return true;
  }
  return undefined;
});
