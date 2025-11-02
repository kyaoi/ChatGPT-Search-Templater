import type {
  ExecuteTemplateInlineTemplate,
  ExecuteTemplateMessage,
  ExecuteTemplateOverrides,
  ExecuteTemplateResponse,
} from '@shared/messages.js';

export interface ExecuteTemplateRequest {
  templateId?: string;
  text: string;
  overrides?: ExecuteTemplateOverrides;
  inlineTemplate?: ExecuteTemplateInlineTemplate;
}

export function executeTemplate(
  request: ExecuteTemplateRequest,
): Promise<ExecuteTemplateResponse> {
  return new Promise((resolve, reject) => {
    const message: ExecuteTemplateMessage = {
      type: 'execute-template',
      templateId: request.templateId,
      text: request.text,
    };

    if (request.overrides) {
      message.overrides = request.overrides;
    }

    if (request.inlineTemplate) {
      message.inlineTemplate = request.inlineTemplate;
    }

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
