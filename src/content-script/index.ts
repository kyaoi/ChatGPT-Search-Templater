import type {
  AlertMessage,
  GetSelectionMessage,
  SelectionResponsePayload,
  SendResponse,
} from '@shared/messages.js';

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    _sender: unknown,
    sendResponse: SendResponse<SelectionResponsePayload>,
  ) => {
    if (isAlertMessage(message)) {
      window.alert(message.message);
      return undefined;
    }

    if (isGetSelectionMessage(message)) {
      const selection = window.getSelection()?.toString() ?? '';
      sendResponse({ text: selection });
      return true;
    }

    return undefined;
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isAlertMessage(value: unknown): value is AlertMessage {
  if (!isRecord(value)) {
    return false;
  }
  const { type, message } = value;
  return (
    typeof type === 'string' && type === 'alert' && typeof message === 'string'
  );
}

function isGetSelectionMessage(value: unknown): value is GetSelectionMessage {
  if (!isRecord(value)) {
    return false;
  }
  const { type } = value;
  return typeof type === 'string' && type === 'get-selection';
}
