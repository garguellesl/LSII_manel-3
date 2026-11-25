import { useEffect, useSyncExternalStore } from 'react';
import { catalogues, es } from './catalogues';
import type { TranslationKey } from './catalogues';

export type Locale = 'es' | 'ca' | 'en';
type Parameters = Record<string, string | number>;
const listeners = new Set<() => void>();
const memory = new Map<string, Locale>();
let identity = 'guest';
let accountDefault: Locale = 'es';
const storageKey = (owner: string) => `protube.locale.${owner}`;

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'ca' || value === 'en';
}

function preference(owner: string): Locale | undefined {
  if (memory.has(owner)) return memory.get(owner);
  try {
    const value = window.localStorage.getItem(storageKey(owner));
    return isLocale(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

let current: Locale = preference(identity) ?? 'es';

function publish(locale: Locale) {
  current = locale;
  document.documentElement.lang = locale;
  listeners.forEach((listener) => listener());
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale) {
  if (!isLocale(locale)) return;
  memory.set(identity, locale);
  try {
    window.localStorage.setItem(storageKey(identity), locale);
  } catch {
    // A blocked browser store still permits a language change for this session.
  }
  publish(locale);
}

export function setAccountLocale(user: { id: number; preferredLanguage?: string | null } | null) {
  const owner = user ? String(user.id) : 'guest';
  const fallback = isLocale(user?.preferredLanguage) ? user.preferredLanguage : 'es';
  if (owner === identity && fallback === accountDefault) return;
  identity = owner;
  accountDefault = fallback;
  publish(preference(owner) ?? fallback);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLocale(): Locale {
  const locale = useSyncExternalStore(subscribe, getLocale, () => 'es');
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return locale;
}

export function translate(key: string, locale: Locale, parameters: Parameters = {}): string {
  const catalogue: Partial<Record<string, string>> = catalogues[locale];
  const fallback: Partial<Record<string, string>> = es;
  const text = catalogue[key] || fallback[key] || catalogue['errors.generic']!;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => String(parameters[name] ?? match));
}

export function t(key: TranslationKey, parameters: Parameters = {}): string {
  return translate(key, current, parameters);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(current).format(value);
}

export function categoryLabel(category: string): string {
  const key = `category.${category}`;
  return Object.prototype.hasOwnProperty.call(es, key) ? translate(key, current) : category;
}

export function formatDate(
  value: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(current, options).format(date);
}

export function plural(
  base: 'player.views' | 'player.likes' | 'player.dislikes' | 'upload.selectedTags',
  count: number,
  parameters: Parameters = {}
): string {
  const form = new Intl.PluralRules(current).select(count) === 'one' ? 'one' : 'other';
  return translate(`${base}.${form}`, current, { ...parameters, count: formatNumber(count) });
}

const messageKeys = new Map<string, TranslationKey>();
for (const catalogue of Object.values(catalogues)) {
  for (const [key, message] of Object.entries(catalogue)) messageKeys.set(message, key as TranslationKey);
}
messageKeys.set('tag must be at most 80 characters', 'errors.tagLength');

// Error state may outlive a locale change; resolve known messages again when rendering.
export function localizeMessage(message: string, fallback: TranslationKey = 'errors.generic'): string {
  if (!message) return '';
  const key = messageKeys.get(message);
  return t(key ?? fallback);
}

export function fieldErrors(fields: Record<string, string> = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(fields).map(([field, message]) => [field, localizeMessage(message, 'errors.field')])
  );
}

export function apiError(code: unknown, status: number | undefined, fallback: string): string {
  if (code === 'COMMENT_DELETED') return t('errors.deletedComment');
  if (code === 'ACCOUNT_CREATED_SESSION_FAILED') return t('errors.accountCreated');
  if (status === 401) return t('errors.session');
  if (status === 403) return t('errors.forbidden');
  return localizeMessage(fallback);
}
