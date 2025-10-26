import { createRoot } from 'react-dom/client';
import { OptionsApp } from './OptionsApp.js';

function bootstrap(): void {
  const container = document.getElementById('root');
  if (!container) {
    return;
  }
  const root = createRoot(container);
  root.render(<OptionsApp />);
}

document.addEventListener('DOMContentLoaded', bootstrap);
