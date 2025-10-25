type SendResponse = (response?: Record<string, unknown>) => void;

chrome.runtime.onMessage.addListener(
  (message: unknown, _sender: unknown, sendResponse: SendResponse) => {
    if (!message || typeof message !== 'object') {
      return undefined;
    }

    const payload = message as { type?: string; message?: string };

    if (payload.type === 'alert' && typeof payload.message === 'string') {
      window.alert(payload.message);
      return undefined;
    }

    if (payload.type === 'get-selection') {
      const selection = window.getSelection()?.toString() ?? '';
      sendResponse({ text: selection });
      return true;
    }

    return undefined;
  },
);
