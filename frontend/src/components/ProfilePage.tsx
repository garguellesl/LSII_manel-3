import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function ProfilePage() {
  const auth = useAuth();
  const { refresh } = auth;
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;
    void refresh().then(() => {
      if (active) setChecked(true);
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  if (!checked || auth.status === 'loading') return <p role="status">Cargando tu perfil…</p>;
  if (auth.status === 'anonymous') return <Navigate to="/login" replace state={{ from: '/profile' }} />;
  if (auth.status === 'error' || !auth.user) {
    return (
      <main className="auth-card">
        <h1>Mi perfil</h1>
        <p role="alert">No se ha podido cargar tu perfil. Comprueba tu conexión.</p>
        <button className="auth-submit" type="button" onClick={() => void refresh()}>
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="auth-card profile-card">
      <h1>Mi perfil</h1>
      <p>Tu información de cuenta, visible solo para ti.</p>
      <dl>
        <dt>Nombre de usuario</dt>
        <dd>{auth.user.accountName}</dd>
        <dt>Email</dt>
        <dd>{auth.user.email}</dd>
        <dt>Nombre</dt>
        <dd>{auth.user.firstName}</dd>
        <dt>Apellidos</dt>
        <dd>{auth.user.lastName}</dd>
        <dt>Miembro desde</dt>
        <dd>{new Date(auth.user.createdAt).toLocaleDateString('es-ES')}</dd>
      </dl>
    </main>
  );
}
