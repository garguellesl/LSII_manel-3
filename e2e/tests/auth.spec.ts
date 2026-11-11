import { test, expect } from '@playwright/test';
import { uniqueUser } from '../fixtures/users';

/**
 * Recorrido 1 (specs/sprint-2/spec.md, T18): registro con sesión automática ->
 * perfil -> logout -> login. RF-4, RF-5, RF-6.
 */
test('register with automatic session, view profile, logout, then log back in', async ({ page }) => {
  const user = uniqueUser('auth');

  await page.goto('/register');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Nombre de usuario').fill(user.accountName);
  // "Nombre" is also a substring of the "Nombre de usuario" label, so it
  // needs an exact match to avoid a strict-mode violation.
  await page.getByLabel('Nombre', { exact: true }).fill(user.firstName);
  await page.getByLabel('Apellidos').fill(user.lastName);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /crear cuenta|enviando/i }).click();

  // Registro con sesión automática: redirige a "/" ya autenticado, sin pasar por login.
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Mi perfil' })).toBeVisible();

  await page.getByRole('link', { name: 'Mi perfil' }).click();
  await expect(page).toHaveURL('/profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();

  // Se acota a la lista de detalles de la cuenta: el nombre de cuenta también
  // aparece en el menú de cuenta de la cabecera, y un `getByText` sin acotar
  // coincidiría con ambos (violación de modo estricto de Playwright).
  const details = page.locator('dl.profile-details');
  await expect(details.getByText(user.accountName, { exact: true })).toBeVisible();
  await expect(details.getByText(user.email, { exact: true })).toBeVisible();
  await expect(details.getByText(user.firstName, { exact: true })).toBeVisible();
  await expect(details.getByText(user.lastName, { exact: true })).toBeVisible();

  // Cerrar sesión dispara dos navegaciones que compiten y cuál gana no es
  // determinista (bug conocido, documentado en specs/sprint-2/task.md bajo
  // "Known bug: carrera de navegaciones al cerrar sesión" para que el equipo
  // lo corrija). Por eso este test NO fija a qué ruta pública aterriza el
  // cliente justo después del clic. Lo que sí exige la spec (RF-5 "cerrar
  // sesión revocará el acceso"; RF-6 "sin sesión ... no podrá leer el perfil
  // mediante la interfaz ni llamando directamente al backend") se comprueba
  // de forma explícita e independiente de esa carrera:
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();

  // 1) El servidor ha revocado la sesión: una petición directa a un recurso
  // privado debe rechazarse, no solo la interfaz dejar de mostrarlo.
  const meAfterLogout = await page.request.get('/api/users/me');
  expect(meAfterLogout.status()).toBe(401);

  // 2) La página privada queda inaccesible: una visita directa a /profile
  // (navegación dura, no un link de la carrera anterior) debe rechazarse y
  // redirigir a /login, con independencia de dónde haya aterrizado el logout.
  await page.goto('/profile');
  await expect(page).toHaveURL('/login');

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /iniciar sesión|enviando/i }).click();

  // Login tras ese rechazo: vuelve a /profile (consume el `state.from` que la
  // redirección del paso 2 acaba de fijar), cerrando el recorrido.
  await expect(page).toHaveURL('/profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
});
