import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const video = {
  id: 7,
  title: "Vídeo original · My video",
  description: "Descripció original",
  user: "creator",
  author: null,
  videoUrl: "video.mp4",
  thumbnailUrl: null,
  tags: ["rock"],
  viewsCount: 1,
  likesCount: 0,
  dislikesCount: 0,
};
const account = {
  id: 51,
  email: "locale@example.test",
  accountName: "locale",
  firstName: "First",
  lastName: "Last",
  displayName: "Locale user",
  description: null,
  avatarUrl: null,
  createdAt: "2026-11-25T12:00:00",
  preferredLanguage: null as string | null,
};
const messages = {
  es: {
    catalog: "Vídeos disponibles",
    register: "Crea tu cuenta",
    submit: "Crear cuenta",
    login: "Iniciar sesión",
    logout: "Cerrar sesión",
    profile: "Mi perfil",
    comments: "Comentarios",
    recommended: "Vídeos recomendados",
    search: "Buscar vídeos por título o descripción",
    upload: "Subir vídeo",
    analytics: "Analíticas",
    subscriptions: "Mis suscripciones",
    music: "Música",
  },
  ca: {
    catalog: "Vídeos disponibles",
    register: "Crea el teu compte",
    submit: "Crea el compte",
    login: "Inicia la sessió",
    logout: "Tanca la sessió",
    profile: "El meu perfil",
    comments: "Comentaris",
    recommended: "Vídeos recomanats",
    search: "Cerca vídeos per títol o descripció",
    upload: "Puja un vídeo",
    analytics: "Analítiques",
    subscriptions: "Les meves subscripcions",
    music: "Música",
  },
  en: {
    catalog: "Available videos",
    register: "Create your account",
    submit: "Create account",
    login: "Sign in",
    logout: "Sign out",
    profile: "My profile",
    comments: "Comments",
    recommended: "Recommended videos",
    search: "Search videos by title or description",
    upload: "Upload video",
    analytics: "Analytics",
    subscriptions: "My subscriptions",
    music: "Music",
  },
};

async function isolatedApi(page: Page) {
  let signedIn = false;
  let preferredLanguage: string | null = null;
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/api/, "");
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body });
    if (path === "/auth/csrf")
      return json({ token: "isolated-token", headerName: "X-CSRF-TOKEN" });
    if (path === "/auth/register") {
      preferredLanguage = request.postDataJSON().preferredLanguage ?? null;
      signedIn = true;
      return json({ ...account, preferredLanguage }, 201);
    }
    if (path === "/auth/login") {
      signedIn = true;
      return json({ ...account, preferredLanguage });
    }
    if (path === "/auth/logout") {
      signedIn = false;
      return route.fulfill({ status: 204 });
    }
    if (path === "/users/me")
      return json(
        signedIn ? { ...account, preferredLanguage } : {},
        signedIn ? 200 : 401,
      );
    if (path === "/videos")
      return json({
        content: [video],
        page: 0,
        size: 24,
        hasNext: false,
        totalElements: 1,
      });
    if (path === "/videos/7") return json(video);
    if (path === "/categories")
      return json({
        categories: [
          "Music",
          "Gaming",
          "Education",
          "Technology",
          "Entertainment",
          "Sports",
          "Other",
        ],
      });
    if (path === "/users/me/subscriptions")
      return json({
        content: [],
        page: 0,
        size: 24,
        hasNext: false,
        totalElements: 0,
      });
    if (path.endsWith("/reaction"))
      return json({ liked: false, disliked: false });
    if (path.endsWith("/plays")) return route.fulfill({ status: 204 });
    if (path.endsWith("/liked-videos"))
      return json({
        content: [],
        page: 0,
        size: 24,
        hasNext: false,
        totalElements: 0,
      });
    if (
      path.endsWith("/analytics") ||
      path.endsWith("/watch-history") ||
      path.endsWith("/comments") ||
      path.endsWith("/recommendations") ||
      path === "/videos/tags"
    )
      return json([]);
    return json({}, 404);
  });
  await page.route("**/media/**", (route) => route.fulfill({ status: 404 }));
}

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

for (const width of [1280, 375]) {
  for (const locale of ["es", "ca", "en"] as const) {
    test.describe(`${locale} at ${width}px`, () => {
      test.use({ viewport: { width, height: 900 } });
      test.beforeEach(async ({ page }) => isolatedApi(page));

      test("switches by keyboard, persists reloads, preserves form drafts and leaves content unchanged", async ({
        page,
      }) => {
        await page.goto("/");
        await expect(page.locator("html")).toHaveAttribute("lang", "es");
        const selector = page.locator(".language-selector select");
        await selector.focus();
        await page.keyboard.press("Home");
        for (let index = 0; index < ["es", "ca", "en"].indexOf(locale); index++)
          await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        await expect(selector).toHaveValue(locale);
        await expect(
          page.getByRole("heading", { name: messages[locale].catalog }),
        ).toBeVisible();
        await expect(page.getByText(video.title)).toBeVisible();
        await page.reload();
        await expect(selector).toHaveValue(locale);
        await page.goto("/register");
        await expect(
          page.getByRole("heading", { name: messages[locale].register }),
        ).toBeVisible();
        await page.locator("#auth-email").fill("draft@example.test");
        await page.locator("#auth-password").fill("unsaved-password");
        await page.locator("#auth-language").selectOption("ca");
        await selector.selectOption(locale === "en" ? "ca" : "en");
        await expect(page.locator("#auth-email")).toHaveValue(
          "draft@example.test",
        );
        await expect(page.locator("#auth-password")).toHaveValue(
          "unsaved-password",
        );
        await expect(page.locator("#auth-language")).toHaveValue("ca");
        await noOverflow(page);
      });

      test("uses registration language on home, profile, reload and fresh login", async ({
        page,
      }) => {
        await page.goto("/register");
        await page.locator("#auth-email").fill(account.email);
        await page.locator("#auth-accountName").fill(account.accountName);
        await page.locator("#auth-firstName").fill(account.firstName);
        await page.locator("#auth-lastName").fill(account.lastName);
        await page.locator("#auth-password").fill("password123");
        await page.locator("#auth-language").selectOption(locale);
        await page
          .getByRole("button", { name: "Crear cuenta", exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(
          page.getByRole("heading", { name: messages[locale].catalog }),
        ).toBeVisible();
        await page
          .getByRole("link", { name: messages[locale].profile, exact: true })
          .click();
        await expect(
          page.getByRole("heading", {
            name: messages[locale].profile,
            exact: true,
          }),
        ).toBeVisible();
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        const manual = locale === "en" ? "ca" : "en";
        await page.locator(".language-selector select").selectOption(manual);
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("lang", manual);
        await page.locator(".language-selector select").selectOption(locale);
        await noOverflow(page);
        await page.goto("/upload");
        await expect(
          page.getByRole("heading", {
            name: messages[locale].upload,
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("option", {
            name: messages[locale].music,
            exact: true,
          }),
        ).toHaveAttribute("value", "Music");
        await page.locator("#upload-title").fill("Original draft title");
        await page.locator("#upload-category").selectOption("Music");
        await page
          .locator("#upload-video")
          .setInputFiles({
            name: "draft.mp4",
            mimeType: "video/mp4",
            buffer: Buffer.from("local test fixture"),
          });
        await page.locator(".language-selector select").selectOption(manual);
        await expect(page.locator("#upload-title")).toHaveValue(
          "Original draft title",
        );
        await expect(page.locator("#upload-category")).toHaveValue("Music");
        expect(
          await page
            .locator("#upload-video")
            .evaluate((element: HTMLInputElement) => element.files?.[0]?.name),
        ).toBe("draft.mp4");
        await page.locator(".language-selector select").selectOption(locale);
        await noOverflow(page);
        await page.goto("/analytics");
        await expect(
          page.getByRole("heading", {
            name: messages[locale].analytics,
            exact: true,
          }),
        ).toBeVisible();
        await noOverflow(page);
        await page.goto("/subscriptions");
        await expect(
          page.getByRole("heading", {
            name: messages[locale].subscriptions,
            exact: true,
          }),
        ).toBeVisible();
        await noOverflow(page);
        await page
          .getByRole("button", { name: messages[locale].logout, exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute("lang", "es");
        await page.locator(".language-selector select").selectOption(locale);
        await page.goto("/login");
        await page.locator("#auth-email").fill(account.email);
        await page.locator("#auth-password").fill("password123");
        await page
          .getByRole("button", { name: messages[locale].login, exact: true })
          .click();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
      });

      test("keeps active native playback while translating player, comments and recommendations", async ({
        page,
      }) => {
        await page.goto("/videos/7");
        await expect(
          page.getByRole("heading", { name: video.title }),
        ).toBeVisible();
        await page.evaluate(async () => {
          const media = document.querySelector("video")!;
          const canvas = document.createElement("canvas");
          canvas.width = 160;
          canvas.height = 90;
          canvas.getContext("2d")!.fillRect(0, 0, 160, 90);
          media.removeAttribute("src");
          media.srcObject = canvas.captureStream(5);
          media.muted = true;
          Object.assign(window, { localeTestMedia: media });
          await media.play();
        });
        await page.locator(".language-selector select").selectOption(locale);
        expect(
          await page.evaluate(
            () =>
              document.querySelector("video") ===
                (window as unknown as { localeTestMedia: HTMLVideoElement })
                  .localeTestMedia && !document.querySelector("video")!.paused,
          ),
        ).toBe(true);
        await expect(
          page.getByRole("heading", {
            name: messages[locale].comments,
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByRole("heading", {
            name: messages[locale].recommended,
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByText(video.description, { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole("searchbox", { name: messages[locale].search }),
        ).toBeVisible();
        await noOverflow(page);
        await page.screenshot({
          path: test.info().outputPath(`${locale}-${width}.png`),
          fullPage: true,
        });
      });
    });
  }
}
