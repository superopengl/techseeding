import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import i18n from './i18n';
import App from './App';
import { I18nextProvider } from 'react-i18next';

const root = createRoot(document.getElementById('root'));
root.render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
