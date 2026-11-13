import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../utils/authClient';

const PLACEHOLDERS: Record<string, string> = {
  email: 'tu@email.com',
  accountName: 'tu_usuario',
  firstName: 'Ana',
  lastName: 'García López',
  password: '••••••••',
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useAuth();
  const location = useLocation();
  const registering = mode === 'register';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLength, setPasswordLength] = useState(0);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    setPending(true);
    setError('');
    setFields({});
    try {
      if (registering) {
        await auth.signUp({
          email,
          password,
          accountName: String(data.get('accountName') || ''),
          firstName: String(data.get('firstName') || ''),
          lastName: String(data.get('lastName') || ''),
        });
      } else {
        await auth.signIn({ email, password });
      }
    } catch (failure) {
      setError(
        failure instanceof AuthError ? failure.message : 'No se ha podido completar la operación. Inténtalo de nuevo.'
      );
      setFields(failure instanceof AuthError ? failure.fields : {});
    } finally {
      setPending(false);
    }
  };

  if (auth.status === 'authenticated') {
    return <Navigate to={['/profile', '/upload'].includes(location.state?.from) ? location.state.from : '/'} replace />;
  }

  const field = (name: string, label: string, autoComplete: string, type = 'text') => {
    const isPassword = name === 'password';
    return (
      <div className="auth-field">
        <label htmlFor={`auth-${name}`}>{label}</label>
        <div className={isPassword ? 'auth-input-group' : undefined}>
          <input
            id={`auth-${name}`}
            name={name}
            type={isPassword && showPassword ? 'text' : type}
            required
            autoComplete={autoComplete}
            maxLength={isPassword ? (registering ? 72 : undefined) : name === 'email' ? 255 : 100}
            minLength={isPassword && registering ? 8 : undefined}
            placeholder={PLACEHOLDERS[name]}
            aria-invalid={Boolean(fields[name])}
            aria-describedby={
              [fields[name] && `error-${name}`, isPassword && registering && 'password-hint']
                .filter(Boolean)
                .join(' ') || undefined
            }
            onChange={isPassword ? (event) => setPasswordLength(event.target.value.length) : undefined}
          />
          {isPassword && (
            <button
              type="button"
              className="auth-toggle-password"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          )}
        </div>
        {fields[name] && (
          <small id={`error-${name}`} className="auth-field-error">
            {fields[name]}
          </small>
        )}
      </div>
    );
  };

  const passwordReady = passwordLength >= 8;

  return (
    <main className="auth-shell">
      <aside className="auth-aside" aria-hidden="true">
        <img src="/protube-imago-removebg-preview.png" alt="" className="auth-aside-logo" />
        <p className="auth-aside-title">{registering ? 'Únete a Protube' : 'Tu sitio para ver y compartir'}</p>
        <ul className="auth-aside-list">
          <li>Guarda tu perfil y tu historial</li>
          <li>Comenta y da me gusta a los vídeos</li>
          <li>Consulta las estadísticas de tu canal</li>
        </ul>
      </aside>
      <div className="auth-card">
        <h1>{registering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
        <p className="auth-subtitle">
          {registering ? 'Guarda tu perfil y participa en Protube.' : 'Entra para acceder a tu perfil.'}
        </p>
        <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
          {field('email', 'Email', 'email', 'email')}
          {registering && field('accountName', 'Nombre de usuario', 'username')}
          {registering && (
            <div className="auth-row">
              {field('firstName', 'Nombre', 'given-name')}
              {field('lastName', 'Apellidos', 'family-name')}
            </div>
          )}
          {field('password', 'Contraseña', registering ? 'new-password' : 'current-password', 'password')}
          {registering && (
            <small id="password-hint" className={passwordReady ? 'auth-hint auth-hint--ok' : 'auth-hint'}>
              <span aria-hidden="true">{passwordReady ? '✓' : '•'}</span> Usa al menos 8 caracteres.
            </small>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? 'Enviando…' : registering ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="auth-alternative">
          {registering ? '¿Ya tienes cuenta? ' : '¿Todavía no tienes cuenta? '}
          <Link to={registering ? '/login' : '/register'} state={location.state}>
            {registering ? 'Iniciar sesión' : 'Registrarse'}
          </Link>
        </p>
      </div>
    </main>
  );
}
