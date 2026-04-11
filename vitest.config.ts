import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'packages/*/src/**/*.{test,spec}.{ts,tsx}',
      'apps/*/src/**/*.{test,spec}.{ts,tsx}'
    ],
    // Limit to 1 core to prevent overheating
    poolOptions: {
      threads: {
        maxThreads: 1,
        minThreads: 1,
      },
      forks: {
        maxForks: 1,
        minForks: 1,
      },
    },
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
