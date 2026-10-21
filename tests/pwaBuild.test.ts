import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Builds the app into a temp folder and checks the PWA output (manifest, service worker, HTML tags).
let outDir: string;

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'simon-build-'));
  await build({ logLevel: 'silent', build: { outDir, emptyOutDir: true } });
}, 60_000);

afterAll(() => {
  rmSync(outDir, { recursive: true, force: true });
});

const read = (file: string) => readFileSync(join(outDir, file), 'utf-8');

describe('PWA build output', () => {
  it('produces a valid Hebrew RTL manifest under /Simon/', () => {
    const manifest = JSON.parse(read('manifest.webmanifest'));
    expect(manifest).toMatchObject({
      name: 'סימון',
      lang: 'he',
      dir: 'rtl',
      start_url: '/Simon/',
      scope: '/Simon/',
      display: 'standalone',
      background_color: '#111827',
      theme_color: '#111827',
    });
    const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
    expect(sizes).toContain('192x192');
    expect(sizes).toContain('512x512');
    expect(manifest.icons.some((icon: { purpose?: string }) => icon.purpose === 'maskable')).toBe(true);
    for (const icon of manifest.icons) {
      expect(existsSync(join(outDir, icon.src)), icon.src).toBe(true);
    }
  });

  it('precaches the HTML, scripts, styles, fonts and icons', () => {
    const sw = read('sw.js');
    expect(sw).toMatch(/"index\.html"/);
    expect(sw).toMatch(/assets\/index-[\w-]+\.js/);
    expect(sw).toMatch(/assets\/index-[\w-]+\.css/);
    expect(sw).toMatch(/rubik-hebrew-400-normal-[\w-]+\.woff2/);
    expect(sw).toMatch(/pwa-512x512\.png/);
    expect(sw).toMatch(/apple-touch-icon-180x180\.png/);
  });

  it('links the manifest and the iPhone icon in index.html', () => {
    const html = read('index.html');
    expect(html).toContain('<link rel="manifest" href="/Simon/manifest.webmanifest">');
    expect(html).toContain('href="/Simon/apple-touch-icon-180x180.png"');
    expect(html).toContain('/Simon/registerSW.js');
  });
});
