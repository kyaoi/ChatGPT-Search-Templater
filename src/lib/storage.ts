import { ExtensionSettings, normalizeSettings } from './settings.js';

const STORAGE_KEY = 'chatgpt-search-templater/settings';

export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result: Record<string, unknown>) => {
      const rawSettings = (result?.[STORAGE_KEY] as Partial<ExtensionSettings>) ?? undefined;
      resolve(normalizeSettings(rawSettings));
    });
  });
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: settings }, () => {
      const runtimeError = chrome.runtime?.lastError;
      if (runtimeError) {
        reject(runtimeError);
        return;
      }
      resolve();
    });
  });
}

type StorageChange = {
  newValue?: unknown;
  oldValue?: unknown;
};

export function observeSettings(callback: (settings: ExtensionSettings) => void): void {
  chrome.storage.onChanged.addListener((changes: Record<string, StorageChange>, areaName: string) => {
    if (areaName !== 'sync') {
      return;
    }
    const storageChange = changes[STORAGE_KEY];
    if (!storageChange) {
      return;
    }

    const newValue = storageChange.newValue as Partial<ExtensionSettings> | undefined;
    callback(normalizeSettings(newValue));
  });
}

export function ensureDefaults(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, async (result: Record<string, unknown>) => {
      const current = result?.[STORAGE_KEY] as Partial<ExtensionSettings> | undefined;
      const normalized = normalizeSettings(current);
      if (!current) {
        await saveSettings(normalized).catch(() => {
          /* noop */
        });
      }
      resolve(normalized);
    });
  });
}
