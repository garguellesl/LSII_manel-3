import { localizeMessage, t, useLocale } from '../i18n/locale';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from './UserAvatar';
import { subscriptionMessages } from '../utils/subscriptionMessages';

export function AccountMenu() {
  useLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const logout = async () => {
    setError('');
    try {
      await auth.signOut();
      navigate('/');
    } catch {
      setError(t('catalogue.couldNotSignOutCheckYourConnectionAndTryAgain'));
    }
  };

  return (
    <nav className="account-bar" aria-label={t('catalogue.userAccount')}>
      {auth.status === 'loading' && <span role="status">{t('catalogue.checkingSession')}</span>}
      {auth.status === 'anonymous' && (
        <>
          <Link className="account-link" to="/login">
            {' '}
            {t('catalogue.signIn')}{' '}
          </Link>
          <Link className="account-link account-link--primary" to="/register">
            {' '}
            {t('catalogue.register')}{' '}
          </Link>
        </>
      )}
      {auth.status === 'authenticated' && auth.user && (
        <>
          <Link className="account-link" to="/videos/new">
            {' '}
            {t('catalogue.registerExistingVideo')}{' '}
          </Link>
          <Link className="account-link account-link--primary" to="/upload">
            {' '}
            {t('catalogue.uploadVideo')}{' '}
          </Link>
          <Link className="account-link account-profile" to="/profile" aria-label={t('catalogue.myProfile')}>
            <UserAvatar name={auth.user.accountName} src={auth.user.avatarUrl} />
            <span className="account-name">{auth.user.displayName || auth.user.accountName}</span>
          </Link>
          <Link className="account-link" to="/subscriptions">
            {subscriptionMessages().subscriptions}
          </Link>
          <button className="account-link" type="button" onClick={() => void logout()}>
            {' '}
            {t('catalogue.signOut')}{' '}
          </button>
        </>
      )}
      {auth.status === 'error' && (
        <>
          <span>{t('catalogue.sessionNotChecked')}</span>
          <button className="account-link" type="button" onClick={() => void auth.refresh()}>
            {' '}
            {t('catalogue.retrySession')}{' '}
          </button>
        </>
      )}
      {error && <p role="alert">{localizeMessage(error)}</p>}
    </nav>
  );
}
