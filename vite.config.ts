import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Published at https://annaknovak-ai.github.io/Simon/
  base: '/Simon/',
  plugins: [
    VitePWA({
      // No skipWaiting/clientsClaim and no update prompt: a new version is
      // downloaded in the background and used, as a whole, on the next launch.
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'סימון',
        short_name: 'סימון',
        lang: 'he',
        dir: 'rtl',
        start_url: '/Simon/',
        scope: '/Simon/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111827',
        theme_color: '#111827',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // woff2 only: every supported browser uses it, the .woff fallbacks are never loaded.
        globPatterns: ['**/*.{html,js,css,svg,png,ico,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
