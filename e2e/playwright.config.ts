import { defineConfig, devices } from '@playwright/test';

/**
 * Suite E2E de Protube (T18/NFR-02, specs/sprint-2/spec.md).
 * Se ejecuta contra un despliegue Docker Compose aislado (proyecto `protube-e2e`),
 * nunca contra la base/volumen de desarrollo. Ver specs/sprint-2/plan.md para el
 * mecanismo de aislamiento y README.md de esta carpeta para los comandos.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:18080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
