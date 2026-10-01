import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };
// Short commit SHA in CI (GitHub Actions sets GITHUB_SHA), "dev" locally. Shown next to the
// version in the settings so it is obvious on the iPhone which build is actually running.
const buildId = process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : 'dev';

export default defineConfig({
  // Relative base so the built app works from any subpath (e.g. GitHub Pages project
  // sites at https://<user>.github.io/<repo>/) without per-host configuration.
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_BUILD__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' + injectRegister: false (same pattern as Kostenblick): the service worker is
      // registered exactly once by usePwaUpdate(), which also re-checks for updates whenever
      // the installed iOS app returns to the foreground. A new version is then offered via the
      // in-app hint ("Jetzt aktualisieren") – no need to re-add the app to the home screen.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '.',
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
        cleanupOutdatedCaches: true,
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
