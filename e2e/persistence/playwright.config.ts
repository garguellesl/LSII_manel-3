import { defineConfig, devices } from '@playwright/test';

/**
 * Suite de verificación de persistencia tras reinicio (RF-8,
 * specs/sprint-3/persistence.md). Deliberadamente separada de
 * ../playwright.config.ts (testDir distinto): `npx playwright test` normal
 * desde e2e/ no la recoge, porque requiere recrear contenedores reales entre
 * las fases "seed" y "verify" (orquestado por run-persistence-check.sh), algo
 * que la suite E2E habitual no hace ni necesita.
 */
export default defineConfig({
  testDir: '.',
  // Playwright wipes its outputDir at the start of every run. The default
  // ('test-results', shared with ../playwright.config.ts) would delete
  // persistence-seed.json written by seed.spec.ts before verify.spec.ts (a
  // separate `playwright test` invocation) gets to read it. Keep this run's
  // artifacts in their own folder so the seed fixture under test-results/
  // survives between the two phases.
  outputDir: 'persistence-artifacts',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['html', { outputFolder: 'persistence-report', open: 'never' }], ['github']] : 'list',
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
