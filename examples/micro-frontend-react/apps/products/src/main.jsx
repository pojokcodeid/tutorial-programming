import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './products.css';

/* Konteks tiruan supaya remote bisa dibuka sendiri tanpa shell. */
const ctx = {
  route: 'katalog',
  navigate: (to) => {
    location.hash = to;
  },
  toast: (message, type) => console.log(`[toast:${type}]`, message)
};

createRoot(document.getElementById('remote-root')).render(
  <React.StrictMode>
    <App ctx={ctx} />
  </React.StrictMode>
);
