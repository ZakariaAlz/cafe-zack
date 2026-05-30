import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  // Generous per-test timeout: the dev server compiles the scene on first hit
  // and the drive-through includes deliberate waits.
  timeout: 120 * 1000,
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 60 * 1000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Bundled chromium with software WebGL — this machine and CI runners
        // have no GPU / system Chrome. swiftshader renders the R3F canvas.
        launchOptions: {
          args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
        },
      },
    },
  ],
  webServer: {
    // In CI, serve a production build instead of `next dev`: Turbopack's
    // on-demand compile of the heavy 3D scene under swiftshader was slow and
    // variable enough to flake the drive-through (canvas mount / prompts).
    // A prebuilt `next start` mounts the canvas fast and consistently.
    command: process.env.CI ? "bun run build && bun run start" : "bun run dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    // Headroom for `next build` to finish before `next start` answers.
    timeout: 180 * 1000,
  },
});
