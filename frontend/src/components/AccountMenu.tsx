import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from './UserAvatar';

export function AccountMenu() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const logout = async () => {
    setError('');
    try {
      await auth.signOut();
      navigate('/');
    } catch {
      setError('No se ha podido cerrar sesión. Comprueba tu conexión y vuelve a intentarlo.');
    }
  };

  return (
    <nav className="account-bar" aria-label="Cuenta de usuario">
      {auth.status === 'loading' && <span role="status">Comprobando sesión…</span>}
      {auth.status === 'anonymous' && (
        <>
          <Link className="account-link" to="/login">
            Iniciar sesión
          </Link>
          <Link className="account-link account-link--primary" to="/register">
            Registrarse
          </Link>
        </>
      )}
      {auth.status === 'authenticated' && auth.user && (
        <>
          <Link className="account-link account-profile" to="/profile" aria-label="Mi perfil">
            <UserAvatar name={auth.user.accountName} />
            <span className="account-name">{auth.user.accountName}</span>
          </Link>
          <button className="account-link" type="button" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </>
      )}
      {auth.status === 'error' && (
        <>
          <span>Sesión sin comprobar</span>
          <button className="account-link" type="button" onClick={() => void auth.refresh()}>
            Reintentar sesión
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </nav>
  );
}
