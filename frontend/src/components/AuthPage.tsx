import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../utils/authClient';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const auth = useAuth();
  const location = useLocation();
  const registering = mode === 'register';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});

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
    return <Navigate to={location.state?.from === '/profile' ? '/profile' : '/'} replace />;
  }

  const field = (name: string, label: string, autoComplete: string, type = 'text') => (
    <div className="auth-field">
      <label htmlFor={`auth-${name}`}>{label}</label>
      <input
        id={`auth-${name}`}
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        maxLength={name === 'password' ? (registering ? 72 : undefined) : name === 'email' ? 255 : 100}
        minLength={name === 'password' && registering ? 8 : undefined}
        aria-invalid={Boolean(fields[name])}
        aria-describedby={fields[name] ? `error-${name}` : undefined}
      />
      {fields[name] && (
        <small id={`error-${name}`} className="auth-field-error">
          {fields[name]}
        </small>
      )}
    </div>
  );

  return (
    <main className="auth-card">
      <h1>{registering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
      <p>{registering ? 'Guarda tu perfil y participa en Protube.' : 'Entra para acceder a tu perfil.'}</p>
      <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
        {field('email', 'Email', 'email', 'email')}
        {registering && field('accountName', 'Nombre de usuario', 'username')}
        {registering && field('firstName', 'Nombre', 'given-name')}
        {registering && field('lastName', 'Apellidos', 'family-name')}
        {field('password', 'Contraseña', registering ? 'new-password' : 'current-password', 'password')}
        {registering && <small>Usa al menos 8 caracteres.</small>}
        {error && <p role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={pending}>
          {pending ? 'Enviando…' : registering ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
      </form>
      <p className="auth-alternative">
        {registering ? '¿Ya tienes cuenta? ' : '¿Todavía no tienes cuenta? '}
        <Link to={registering ? '/login' : '/register'}>{registering ? 'Iniciar sesión' : 'Registrarse'}</Link>
      </p>
    </main>
  );
}
