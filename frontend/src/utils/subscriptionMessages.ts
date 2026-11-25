import { getLocale, isLocale, translate } from '../i18n/locale';

const keys = [
  'subscriptions',
  'subscribe',
  'unsubscribe',
  'signIn',
  'loading',
  'retry',
  'stateError',
  'writeError',
  'listError',
  'creatorError',
  'creatorMissing',
  'videosError',
  'sessionError',
  'emptyList',
  'emptyVideos',
  'videos',
  'browse',
  'previous',
  'next',
  'pages',
  'page',
] as const;

export function subscriptionMessages(languages: readonly string[] = [getLocale()]) {
  const locale = languages.map((language) => language.toLowerCase().split('-')[0]).find(isLocale) ?? 'es';
  return Object.fromEntries(keys.map((key) => [key, translate(`library.subscription.${key}`, locale)])) as Record<
    (typeof keys)[number],
    string
  >;
}
