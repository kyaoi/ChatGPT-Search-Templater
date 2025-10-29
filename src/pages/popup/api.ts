import type {
  ExecuteTemplateMessage,
  ExecuteTemplateResponse,
} from '@shared/messages.js';

export function executeTemplate(
  templateId: string,
  text: string,
): Promise<ExecuteTemplateResponse> {
  return new Promise((resolve, reject) => {
    const message: ExecuteTemplateMessage = {
      type: 'execute-template',
      templateId,
      text,
    };

    chrome.runtime.sendMessage(message, (response: ExecuteTemplateResponse) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(runtimeError);
        return;
      }
      resolve(response ?? { success: false });
    });
  });
}
