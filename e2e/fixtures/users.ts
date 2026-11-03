/**
 * Genera identidades únicas por ejecución para que cada test registre su
 * propio usuario (specs/sprint-2/spec.md, T18: "cada test crea sus propios
 * usuarios para no depender del orden"). Nunca reutiliza la cuenta demo.
 */
export type NewUser = {
  email: string;
  accountName: string;
  firstName: string;
  lastName: string;
  password: string;
};

// Contraseña de prueba fija: cumple la política (8-72 bytes UTF-8); no es un
// secreto real, solo se usa contra el stack E2E aislado.
export const TEST_PASSWORD = 'E2eTestPass123!';

let counter = 0;

export function uniqueUser(label: string): NewUser {
  const suffix = `${Date.now()}-${process.pid}-${++counter}`;
  return {
    email: `e2e.${label}.${suffix}@protube-e2e.test`,
    accountName: `e2e_${label}_${suffix}`.slice(0, 100),
    firstName: 'E2E',
    lastName: `Test-${suffix}`,
    password: TEST_PASSWORD,
  };
}
