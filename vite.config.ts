import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  // Relative base so the built app works from any subpath (e.g. GitHub Pages project
  // sites at https://<user>.github.io/<repo>/) without per-host configuration.
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Vorrat – Haushaltsinventar',
        short_name: 'Vorrat',
        description: 'Schnelle, offline-fähige Haushaltsinventar-Verwaltung',
        theme_color: '#1c1c1e',
        background_color: '#ffffff',
        display: 'standalone',
        // Relative start_url/scope resolve against the manifest's own URL, so they work
        // whether the app is served from a domain root or a subpath.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
});
