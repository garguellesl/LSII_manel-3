import { useEffect, useId, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t, useLocale } from '../i18n/locale';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from './UserAvatar';

// Home header: only the profile avatar. Account details live behind it, not in the bar.
export function AccountChip() {
  useLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (auth.status === 'loading') {
    return (
      // Same corner and size as the avatar, so the header does not shift while the session is checked.
      <span
        className="account-chip account-chip--guest account-chip--loading"
        role="status"
        aria-label="Comprobando sesión"
      />
    );
  }

  if (auth.status !== 'authenticated' || !auth.user) {
    return (
      <Link className="account-chip account-chip--guest" to="/login" aria-label="Iniciar sesión">
        <UserAvatar name="?" src={null} />
      </Link>
    );
  }

  const user = auth.user;
  const logout = async () => {
    setError('');
    try {
      await auth.signOut();
      setOpen(false);
      navigate('/');
    } catch {
      setError('No se ha podido cerrar sesión. Comprueba tu conexión y vuelve a intentarlo.');
    }
  };

  return (
    <div className="account-chip" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="account-chip-button"
        aria-label={`Cuenta de ${user.displayName || user.accountName}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <UserAvatar name={user.accountName} src={user.avatarUrl} />
      </button>
      {open && (
        <section id={panelId} className="account-chip-panel" aria-label="Información de tu cuenta">
          <dl className="account-chip-details">
            <dt>Nombre</dt>
            <dd>{user.displayName || user.accountName}</dd>
            <dt>Usuario</dt>
            <dd>@{user.accountName}</dd>
            <dt>Correo</dt>
            <dd>{user.email}</dd>
          </dl>
          <div className="account-chip-actions">
            <Link to="/profile" onClick={() => setOpen(false)}>
              {t('catalogue.myProfile')}
            </Link>
            <Link to="/upload" onClick={() => setOpen(false)}>
              {t('catalogue.uploadVideo')}
            </Link>
            <button type="button" onClick={() => void logout()}>
              {t('catalogue.signOut')}
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </section>
      )}
    </div>
  );
}

export default AccountChip;
