import { test, expect, request as pwRequest } from '@playwright/test';
import { registerUser } from '../fixtures/api';
import { uniqueUser } from '../fixtures/users';

/**
 * Recorrido 6 (specs/sprint-2/spec.md, T18): acceso a /profile sin sesión
 * rechazado. RF-6. ProfilePage.tsx redirige con `<Navigate to="/login"
 * state={{from:'/profile'}}>`, no muestra el perfil bloqueado en el sitio, así
 * que la comprobación correcta es el cambio de URL, seguido del regreso a
 * /profile tras iniciar sesión (consumiendo location.state.from).
 */
test('visiting /profile without a session redirects to login, then back after signing in', async ({
  page,
  baseURL,
}) => {
  const api = await pwRequest.newContext({ baseURL: baseURL! });
  const user = uniqueUser('profileguard');
  await registerUser(api, user);
  await api.dispose();

  await page.goto('/profile');
  await expect(page).toHaveURL('/login');

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(user.password);
  await page.getByRole('button', { name: /iniciar sesión|enviando/i }).click();

  await expect(page).toHaveURL('/profile');
  await expect(page.getByRole('heading', { name: 'Mi perfil' })).toBeVisible();
});
