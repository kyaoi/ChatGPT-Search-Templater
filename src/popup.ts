import { loadSettings } from './lib/storage.js';

interface TemplateOption {
  id: string;
  label: string;
}

function renderTemplateOptions(
  select: HTMLSelectElement,
  templates: TemplateOption[],
  enabled: boolean,
): void {
  select.textContent = '';
  if (templates.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = '有効なテンプレートがありません';
    select.appendChild(option);
    select.setAttribute('disabled', 'true');
    return;
  }

  templates.forEach((template) => {
    const option = document.createElement('option');
    option.value = template.id;
    option.textContent = template.label;
    select.appendChild(option);
  });

  if (enabled) {
    select.removeAttribute('disabled');
  } else {
    select.setAttribute('disabled', 'true');
  }
}

async function initPopup(): Promise<void> {
  const form = document.querySelector<HTMLFormElement>('#popupForm');
  const select = document.querySelector<HTMLSelectElement>('#templateSelect');
  const textarea = document.querySelector<HTMLTextAreaElement>('#inputText');
  const status = document.querySelector<HTMLParagraphElement>('#statusMessage');
  const openOptionsButton = document.querySelector<HTMLButtonElement>('#openOptions');

  if (!form || !select || !textarea || !status || !openOptionsButton) {
    return;
  }

  const settings = await loadSettings();
  const enabledTemplates = settings.templates.filter((template) => template.enabled);

  renderTemplateOptions(
    select,
    enabledTemplates.map((template) => ({ id: template.id, label: template.label })),
    enabledTemplates.length > 0,
  );

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    status.textContent = '';

    const templateId = select.value;
    const input = textarea.value.trim();

    if (!templateId) {
      status.textContent = 'テンプレートが選択できません。オプションから有効化してください。';
      return;
    }

    if (!input) {
      status.textContent = 'テキストを入力してください。';
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: 'execute-template',
        templateId,
        text: input,
      },
      (response: { success: boolean; reason?: string }) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          status.textContent = '実行中にエラーが発生しました。';
          console.error(runtimeError);
          return;
        }

        if (!response?.success) {
          if (response?.reason === 'hard-limit-exceeded') {
            status.textContent = 'URLが長すぎるためキャンセルしました。';
          } else if (response?.reason === 'not-found') {
            status.textContent = 'テンプレートが見つかりません。';
          } else {
            status.textContent = '実行中に問題が発生しました。';
          }
          return;
        }

        status.textContent = 'ChatGPT を開きました。';
      },
    );
  });

  openOptionsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  void initPopup();
});
