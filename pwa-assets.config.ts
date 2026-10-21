import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the PNG/ICO app icons in public/ from public/icon.svg (run: npm run icons).
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background: '#111827' } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background: '#111827' } },
  },
  images: ['public/icon.svg'],
});
