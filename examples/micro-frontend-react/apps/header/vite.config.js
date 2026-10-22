import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

/**
 * Remote ini merilis berkas `remoteEntry.js` sendiri — shell tidak pernah
 * mengimpor berkas internalnya, hanya modul yang diekspos di bawah ini.
 */
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'header',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx'
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' }
      }
    })
  ],
  build: {
    target: 'esnext',
    minify: false
  }
});
