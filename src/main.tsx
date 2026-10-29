import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker for offline capability (in production / APK build)
if (!import.meta.env.DEV && 'serviceWorker' in navigator) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Automatically activate new cache update
      updateSW(true);
    },
    onOfflineReady() {
      console.log('TacoPro está pronto para funcionar 100% offline.');
    },
  });
}

import { LanguageProvider } from './i18n/LanguageContext';

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
