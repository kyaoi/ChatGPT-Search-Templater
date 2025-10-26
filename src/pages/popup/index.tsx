import { createRoot } from 'react-dom/client';
import { PopupApp } from './PopupApp.js';

function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }
  const root = createRoot(container);
  root.render(<PopupApp />);
}

document.addEventListener('DOMContentLoaded', bootstrap);
