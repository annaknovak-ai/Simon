import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Published at https://annaknovak-ai.github.io/Simon/
  base: '/Simon/',
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
