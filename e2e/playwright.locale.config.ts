import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "localisation.spec.ts",
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:4179",
    channel: "chrome",
    locale: "en-US",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node ../frontend/node_modules/vite/bin/vite.js ../frontend --host 127.0.0.1 --port 4179 --strictPort",
    url: "http://127.0.0.1:4179",
    env: { VITE_API_DOMAIN: "", VITE_MEDIA_DOMAIN: "" },
    reuseExistingServer: false,
  },
});
