import { createRoot } from 'react-dom/client';
import { PickerApp } from './PickerApp.js';

function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const initialText = searchParams.get('text') ?? '';
  const initialTemplateId = searchParams.get('templateId') ?? undefined;

  const root = createRoot(container);
  root.render(
    <PickerApp
      initialText={initialText}
      initialTemplateId={initialTemplateId}
    />,
  );
}

document.addEventListener('DOMContentLoaded', bootstrap);
