import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './standalone.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Elemen #root tidak ditemukan di index.html');
}

createRoot(container).render(
  <StrictMode>
    <main className="remote-standalone">
      <App />
    </main>
  </StrictMode>
);
