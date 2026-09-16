import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from '@/app/App';
import { seedDefaultsIfEmpty } from '@/db/seed';
import '@/styles/global.css';

seedDefaultsIfEmpty().catch((error) => {
  console.error('Fehler beim Anlegen der Standarddaten', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
