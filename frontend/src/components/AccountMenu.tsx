import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from './UserAvatar';
import { AccountChip } from './AccountChip';

// Pages other than the catalogue: a "+" to add videos and the avatar for the account, each opening one small panel.
export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  if (compact) return <AccountChip />;

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
          <Dropdown label="Añadir vídeo" trigger={<span aria-hidden="true">+</span>}>
            {(close) => (
              <>
                <Link to="/upload" onClick={close}>
                  Subir vídeo
                </Link>
                <Link to="/videos/new" onClick={close}>
                  Registrar vídeo existente
                </Link>
              </>
            )}
          </Dropdown>
          <Dropdown
            label={`Cuenta de ${auth.user.displayName || auth.user.accountName}`}
            trigger={<UserAvatar name={auth.user.accountName} src={auth.user.avatarUrl} />}
          >
            {(close) => (
              <>
                <Link to="/profile" onClick={close}>
                  Mi perfil
                </Link>
                <Link to="/subscriptions" onClick={close}>
                  Mis suscripciones
                </Link>
                <button type="button" onClick={() => void logout().finally(close)}>
                  Cerrar sesión
                </button>
              </>
            )}
          </Dropdown>
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

// One icon button that opens a small panel; closes on outside click, Escape or after choosing an action.
function Dropdown({
  label,
  trigger,
  children,
}: {
  label: string;
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="account-dropdown" ref={root}>
      <button
        ref={button}
        type="button"
        className="account-dropdown-trigger"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      {open && (
        <div id={panelId} className="account-dropdown-panel">
          {children(close)}
        </div>
      )}
    </div>
  );
}

export default AccountMenu;
