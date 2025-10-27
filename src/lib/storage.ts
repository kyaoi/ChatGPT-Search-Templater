import { type ExtensionSettings, normalizeSettings } from '@shared/settings.js';

const STORAGE_KEY = 'chatgpt-search-templater/settings';

function isExtensionSettingsLike(
  value: unknown,
): value is Partial<ExtensionSettings> {
  return typeof value === 'object' && value !== null;
}

export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEY, (result: Record<string, unknown>) => {
      const candidate = result?.[STORAGE_KEY];
      const rawSettings = isExtensionSettingsLike(candidate)
        ? candidate
        : undefined;
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

export function observeSettings(
  callback: (settings: ExtensionSettings) => void,
): void {
  chrome.storage.onChanged.addListener(
    (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== 'sync') {
        return;
      }
      const storageChange = changes[STORAGE_KEY];
      if (!storageChange) {
        return;
      }

      const newValue = storageChange.newValue;
      const normalizedSource = isExtensionSettingsLike(newValue)
        ? newValue
        : undefined;
      callback(normalizeSettings(normalizedSource));
    },
  );
}

export function ensureDefaults(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      STORAGE_KEY,
      async (result: Record<string, unknown>) => {
        const candidate = result?.[STORAGE_KEY];
        const current = isExtensionSettingsLike(candidate)
          ? candidate
          : undefined;
        const normalized = normalizeSettings(current);
        if (!current) {
          await saveSettings(normalized).catch(() => {
            /* noop */
          });
        }
        resolve(normalized);
      },
    );
  });
}
