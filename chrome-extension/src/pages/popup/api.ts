import type { ExecuteTemplateResponse } from './types.js';

export function executeTemplate(
  templateId: string,
  text: string,
): Promise<ExecuteTemplateResponse> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        type: 'execute-template',
        templateId,
        text,
      },
      (response: ExecuteTemplateResponse) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(runtimeError);
          return;
        }
        resolve(response ?? { success: false });
      },
    );
  });
}
