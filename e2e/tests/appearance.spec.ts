import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import { createOwnVideo, registerUser } from "../fixtures/api";
import { uniqueUser } from "../fixtures/users";

type Theme = "dark" | "light";
const palette = {
  dark: {
    background: "rgb(40, 44, 52)",
    surface: "rgb(30, 33, 38)",
    text: "rgb(245, 247, 250)",
  },
  light: {
    background: "rgb(244, 246, 250)",
    surface: "rgb(255, 255, 255)",
    text: "rgb(24, 34, 50)",
  },
};

async function chooseTheme(page: Page, theme: Theme) {
  await expect(
    page.getByRole("button", { name: "Modo oscuro", exact: true }),
  ).toBeVisible();
  if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
    await page
      .getByRole("button", { name: "Modo oscuro", exact: true })
      .click();
  }
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    palette[theme].background,
  );
}

function luminance(color: string): number {
  let value = color.trim();
  let channels: number[];
  if (value.startsWith("#")) {
    value = value.slice(1);
    if (value.length === 3)
      value = value
        .split("")
        .map((digit) => digit + digit)
        .join("");
    channels = [0, 2, 4].map((offset) =>
      parseInt(value.slice(offset, offset + 2), 16),
    );
  } else
    channels = value
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number);
  const components = channels.map((component) => {
    const channel = component / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return (
    components[0] * 0.2126 + components[1] * 0.7152 + components[2] * 0.0722
  );
}

async function assertRenderedContrast(element: Locator) {
  const colors = await element.evaluate((node) => {
    const style = getComputedStyle(node);
    return { foreground: style.color, background: style.backgroundColor };
  });
  const first = luminance(colors.foreground);
  const second = luminance(colors.background);
  expect(
    (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05),
  ).toBeGreaterThanOrEqual(4.5);
}

async function assertPaletteContrast(page: Page) {
  const values = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(
      [
        "bg",
        "surface",
        "inset",
        "surface-hover",
        "text",
        "secondary",
        "muted",
        "placeholder",
        "accent",
        "accent-hover",
        "on-accent",
        "focus",
        "border",
        "danger",
        "success",
        "disabled-text",
        "disabled-bg",
      ].map((name) => [name, style.getPropertyValue(`--pt-${name}`).trim()]),
    );
  });
  const ratio = (foreground: string, background: string) => {
    const a = luminance(values[foreground]);
    const b = luminance(values[background]);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  };
  for (const background of ["bg", "surface", "inset", "surface-hover"]) {
    for (const text of [
      "text",
      "secondary",
      "muted",
      "placeholder",
      "accent",
      "danger",
      "success",
    ]) {
      expect(
        ratio(text, background),
        `${text} on ${background}`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      ratio("focus", background),
      `focus on ${background}`,
    ).toBeGreaterThanOrEqual(3);
    expect(
      ratio("border", background),
      `control border on ${background}`,
    ).toBeGreaterThanOrEqual(3);
  }
  expect(ratio("on-accent", "accent")).toBeGreaterThanOrEqual(4.5);
  expect(ratio("on-accent", "accent-hover")).toBeGreaterThanOrEqual(4.5);
  expect(ratio("disabled-text", "disabled-bg")).toBeGreaterThanOrEqual(4.5);
}

test("defaults dark even with a light OS preference; keyboard and disabled party control work across public pages", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const toggle = page.getByRole("button", { name: "Modo oscuro", exact: true });
  await toggle.focus();
  await expect(toggle).toHaveCSS("outline-style", "solid");
  await expect(toggle).toHaveCSS("outline-width", "3px");
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Space");
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Iniciar sesión", exact: true }),
  ).toBeFocused();

  for (const path of ["/", "/login", "/register", "/not-a-page"]) {
    if (path === "/not-a-page") {
      await page.goto("/");
      // Exercise React's existing fallback; unknown server URLs are outside the SPA route mappings.
      await page.evaluate(() => {
        history.pushState(null, "", "/not-a-page");
        dispatchEvent(new PopStateEvent("popstate"));
      });
      await expect(page.getByRole("alert")).toHaveText("Page not found.");
    } else await page.goto(path);
    for (const theme of ["light", "dark"] as const) {
      await chooseTheme(page, theme);
      await expect(
        page.getByRole("group", { name: "Apariencia y experiencia" }),
      ).toHaveCount(1);
      await expect(
        page.getByRole("button", { name: "Modo fiesta · Próximamente" }),
      ).toBeDisabled();
      await assertPaletteContrast(page);
      await assertRenderedContrast(page.locator(".theme-toggle"));
      await assertRenderedContrast(page.locator(".party-placeholder"));
      const primary = page.locator(".account-link--primary");
      await primary.hover();
      await assertRenderedContrast(primary);
      await primary.focus();
      await assertRenderedContrast(primary);
    }
  }
});

test("applies a saved light preference before React downloads, without a dark first paint", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("protube.theme", "light"),
  );
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(/\/assets\/.*\.js(?:\?.*)?$/, async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      palette.light.background,
    );
    await expect(page.locator(".App")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: "Modo oscuro", exact: true }),
  ).toHaveText("Claro");
});

test("persists through navigation and reload, while invalid and blocked storage remain usable", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await chooseTheme(page, "light");
  await page.getByRole("link", { name: "Iniciar sesión", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Bienvenido de nuevo" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => localStorage.setItem("protube.theme", "invalid"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  const context = await browser.newContext();
  await context.addInitScript(() =>
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("denied");
      },
    }),
  );
  const blocked = await context.newPage();
  await blocked.goto(page.url());
  await chooseTheme(blocked, "light");
  await expect(
    blocked.getByRole("button", { name: "Modo oscuro", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await context.close();
});

test("themes authenticated profile, upload, menus, tags and comments while preserving draft and actual playback", async ({
  page,
  request,
}) => {
  await registerUser(request, uniqueUser("appearance"));
  const video = await createOwnVideo(request, {
    title: `Theme video ${crypto.randomUUID()}`,
    description: "Theme test description",
    tags: ["theme-check"],
  });
  const csrf = await (await request.get("/api/auth/csrf")).json();
  expect(
    (
      await request.post(`/api/videos/${video.id}/comments`, {
        headers: { [csrf.headerName]: csrf.token },
        data: { text: "Theme test comment" },
      })
    ).ok(),
  ).toBe(true);
  await page.context().addCookies((await request.storageState()).cookies);

  for (const theme of ["light", "dark"] as const) {
    await page.goto("/profile");
    await chooseTheme(page, theme);
    await expect(page.locator(".profile-panel").first()).toHaveCSS(
      "background-color",
      palette[theme].surface,
    );
    await expect(page.locator(".profile-name")).toHaveCSS(
      "color",
      palette[theme].text,
    );
    await page.goto("/upload");
    await expect(page.getByLabel("Categoría", { exact: true })).toBeEnabled();
    await expect(page.getByLabel("Descripción", { exact: true })).toHaveCSS(
      "background-color",
      palette[theme].surface,
    );
    await expect(page.getByLabel("Categoría", { exact: true })).toHaveCSS(
      "color",
      palette[theme].text,
    );
    await page
      .getByLabel("Título", { exact: true })
      .fill("Draft survives theme change");
    await page
      .getByRole("button", { name: "Modo oscuro", exact: true })
      .click();
    await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
      "Draft survives theme change",
    );
    const instantColors = await page
      .getByRole("button", { name: "Publicar vídeo", exact: true })
      .evaluate((element) => {
        const reference = document.createElement("span");
        reference.style.color = "var(--pt-accent)";
        document.body.append(reference);
        const expected = getComputedStyle(reference).color;
        reference.remove();
        return { actual: getComputedStyle(element).backgroundColor, expected };
      });
    expect(instantColors.actual).toBe(instantColors.expected);
    await chooseTheme(page, theme);
    await page.goto("/");
    await page.getByRole("button", { name: /^Tags/ }).click();
    await expect(page.locator(".tag-panel")).toHaveCSS(
      "background-color",
      palette[theme].surface,
    );
    await expect(page.getByRole("searchbox", { name: "Find a tag" })).toHaveCSS(
      "color",
      palette[theme].text,
    );
    await page.goto(`/videos/${video.id}`);
    await expect(
      page.getByText("Theme test comment", { exact: true }),
    ).toBeVisible();
    const comment = page.getByLabel("Add a comment", { exact: true });
    await comment.fill("Unsent comment");
    await page.getByLabel("Add a tag", { exact: true }).fill("unsent-tag");
    await expect(
      page.getByRole("button", { name: "Post comment", exact: true }),
    ).toHaveCSS(
      "background-color",
      await page.evaluate(() => {
        const probe = document.createElement("span");
        probe.style.color = "var(--pt-accent)";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      }),
    );
    const submitComment = page.getByRole("button", {
      name: "Post comment",
      exact: true,
    });
    await submitComment.hover();
    await assertRenderedContrast(submitComment);
    await submitComment.focus();
    await assertRenderedContrast(submitComment);
    const player = page.locator("video");
    await player.evaluate(async (element: HTMLVideoElement) => {
      element.muted = true;
      element.dataset.retained = "yes";
      await element.play();
    });
    await expect
      .poll(() =>
        player.evaluate((element: HTMLVideoElement) => element.currentTime),
      )
      .toBeGreaterThan(0);
    const src = await player.getAttribute("src");
    const before = await player.evaluate(
      (element: HTMLVideoElement) => element.currentTime,
    );
    const avatar = await page
      .locator(".user-avatar")
      .first()
      .evaluate((element) => getComputedStyle(element).backgroundColor);
    await page
      .getByRole("button", { name: "Modo oscuro", exact: true })
      .click();
    await expect(player).toHaveAttribute("data-retained", "yes");
    await expect(player).toHaveAttribute("src", src!);
    expect(
      await player.evaluate((element: HTMLVideoElement) => element.currentTime),
    ).toBeGreaterThanOrEqual(before);
    expect(
      await player.evaluate((element: HTMLVideoElement) => element.paused),
    ).toBe(false);
    await expect(comment).toHaveValue("Unsent comment");
    await expect(page.getByLabel("Add a tag", { exact: true })).toHaveValue(
      "unsent-tag",
    );
    await expect(player).toHaveCSS("filter", "none");
    await expect(page.locator(".user-avatar").first()).toHaveCSS(
      "background-color",
      avatar,
    );
    await chooseTheme(page, theme);
  }
});

test("both controls fit a 320px screen and remain available while session checking is pending", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/users/me", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Comprobando sesión…")).toBeVisible();
    for (const theme of ["light", "dark"] as const) {
      await chooseTheme(page, theme);
      await expect(
        page.getByRole("button", { name: "Modo fiesta · Próximamente" }),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const box = await page
        .getByRole("button", { name: "Modo oscuro", exact: true })
        .boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  } finally {
    release();
  }
});
