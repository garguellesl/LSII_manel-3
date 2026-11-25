import type { Locale } from '../i18n/locale';
import { localizeMessage, t, useLocale } from '../i18n/locale';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthError } from '../utils/authClient';

const PLACEHOLDERS: Record<string, string> = {
  firstName: 'Ana',
  lastName: 'García López',
  password: '••••••••',
};

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  useLocale();
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
          ...(data.get('preferredLanguage')
            ? { preferredLanguage: String(data.get('preferredLanguage')) as Locale }
            : {}),
        });
      } else {
        await auth.signIn({ email, password });
      }
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : t('account.couldNotCompleteTheOperationTryAgain'));
      setFields(failure instanceof AuthError ? failure.fields : {});
    } finally {
      setPending(false);
    }
  };

  if (auth.status === 'authenticated') {
    return (
      <Navigate
        to={['/profile', '/upload', '/analytics'].includes(location.state?.from) ? location.state.from : '/'}
        replace
      />
    );
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
            placeholder={
              name === 'email'
                ? t('account.emailExample')
                : name === 'accountName'
                  ? t('account.usernameExample')
                  : PLACEHOLDERS[name]
            }
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
              aria-label={showPassword ? t('account.hidePassword') : t('account.showPassword')}
              aria-pressed={showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? t('account.hide') : t('account.show')}
            </button>
          )}
        </div>
        {fields[name] && (
          <small id={`error-${name}`} className="auth-field-error">
            {localizeMessage(fields[name], 'errors.field')}
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
        <p className="auth-aside-title">
          {registering ? t('account.joinProtube') : t('account.yourPlaceToWatchAndShare')}
        </p>
        <ul className="auth-aside-list">
          <li>{t('account.saveYourProfileAndHistory')}</li>
          <li>{t('account.commentOnAndLikeVideos')}</li>
          <li>{t('account.checkYourChannelStatistics')}</li>
        </ul>
      </aside>
      <div className="auth-card">
        <h1>{registering ? t('account.createYourAccount') : t('account.welcomeBack')}</h1>
        <p className="auth-subtitle">
          {registering ? t('account.saveYourProfileAndJoinInOnProtube') : t('account.signInToAccessYourProfile')}
        </p>
        <form onSubmit={(event) => void submit(event)} aria-busy={pending}>
          {field('email', t('account.email'), 'email', 'email')}
          {registering && field('accountName', t('account.username'), 'username')}
          {registering && (
            <div className="auth-row">
              {field('firstName', t('account.firstName'), 'given-name')}
              {field('lastName', t('account.lastName'), 'family-name')}
            </div>
          )}
          {registering && (
            <div className="auth-field">
              <label htmlFor="auth-language">{t('locale.preferred')}</label>
              <select id="auth-language" name="preferredLanguage" defaultValue="">
                <option value="">{t('locale.unassigned')}</option>
                <option value="es" lang="es">
                  Español
                </option>
                <option value="ca" lang="ca">
                  Català
                </option>
                <option value="en" lang="en">
                  English
                </option>
              </select>
            </div>
          )}
          {field('password', t('account.password'), registering ? 'new-password' : 'current-password', 'password')}
          {registering && (
            <small id="password-hint" className={passwordReady ? 'auth-hint auth-hint--ok' : 'auth-hint'}>
              <span aria-hidden="true">{passwordReady ? '✓' : '•'}</span> {t('account.useAtLeast8Characters')}{' '}
            </small>
          )}
          {error && (
            <p className="auth-error" role="alert">
              {localizeMessage(error)}
            </p>
          )}
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? t('account.sending') : registering ? t('account.createAccount') : t('catalogue.signIn')}
          </button>
        </form>
        <p className="auth-alternative">
          {registering ? t('account.alreadyHaveAnAccount') : t('account.dontHaveAnAccountYet')}
          <Link to={registering ? '/login' : '/register'} state={location.state}>
            {registering ? t('catalogue.signIn') : t('catalogue.register')}
          </Link>
        </p>
      </div>
    </main>
  );
}
