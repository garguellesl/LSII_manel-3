import { act, fireEvent, render, screen } from '@testing-library/react';
import { LanguageSelector } from '../../components/LanguageSelector';
import { es, ca, en, catalogues } from '../catalogues';
import {
  apiError,
  categoryLabel,
  fieldErrors,
  formatDate,
  formatNumber,
  getLocale,
  isLocale,
  localizeMessage,
  plural,
  setAccountLocale,
  setLocale,
  t,
  translate,
} from '../locale';

let id = 1000;
beforeEach(() => {
  localStorage.clear();
  setAccountLocale({ id: ++id });
});

describe('Localisation', () => {
  it.each(['es', 'ca', 'en'] as const)(
    'has complete %s keys, values and matching interpolation parameters',
    (locale) => {
      expect(Object.keys(catalogues[locale]).sort()).toEqual(Object.keys(es).sort());
      for (const key of Object.keys(es) as (keyof typeof es)[]) {
        expect(catalogues[locale][key].trim()).not.toBe('');
        const parameters = (text: string) => text.match(/\{\w+\}/g)?.sort() ?? [];
        expect(parameters(catalogues[locale][key])).toEqual(parameters(es[key]));
      }
    }
  );

  it('uses Spanish for an unassigned or unsupported profile, regardless de browser language', () => {
    Object.defineProperty(navigator, 'languages', { configurable: true, value: ['ca-ES', 'en-US'] });
    setAccountLocale({ id: ++id, preferredLanguage: null });
    expect(getLocale()).toBe('es');
    setAccountLocale({ id: ++id, preferredLanguage: 'fr' });
    expect(getLocale()).toBe('es');
    expect(isLocale('fr')).toBe(false);
  });

  it.each(['es', 'ca', 'en'] as const)('uses the profile language %s on session restoration', (preferredLanguage) => {
    setAccountLocale({ id: ++id, preferredLanguage });
    expect(getLocale()).toBe(preferredLanguage);
    expect(document.documentElement.lang).toBe(preferredLanguage);
  });

  it('restores a stored manual choice and isolates account and anonymous preferences', () => {
    const account = ++id;
    localStorage.setItem(`protube.locale.${account}`, 'ca');
    setAccountLocale({ id: account, preferredLanguage: 'en' });
    expect(getLocale()).toBe('ca');
    setLocale('en');
    expect(localStorage.getItem(`protube.locale.${account}`)).toBe('en');
    setAccountLocale({ id: account, preferredLanguage: 'en' });
    expect(getLocale()).toBe('en');
    setAccountLocale(null);
    setLocale('ca');
    setAccountLocale({ id: ++id });
    expect(getLocale()).toBe('es');
    setAccountLocale({ id: account, preferredLanguage: 'es' });
    expect(getLocale()).toBe('en');
    setAccountLocale(null);
    expect(getLocale()).toBe('ca');
  });

  it('ignores invalid storage and retains memory when browser storage fails', () => {
    const account = ++id;
    localStorage.setItem(`protube.locale.${account}`, 'fr');
    setAccountLocale({ id: account, preferredLanguage: 'en' });
    expect(getLocale()).toBe('en');
    const read = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw Error('blocked');
    });
    const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw Error('quota');
    });
    setAccountLocale({ id: ++id });
    setLocale('ca');
    const remembered = id;
    setAccountLocale({ id: ++id });
    setAccountLocale({ id: remembered });
    expect(getLocale()).toBe('ca');
    read.mockRestore();
    write.mockRestore();
  });

  it('switches the accessible native selector and document language', () => {
    render(<LanguageSelector />);
    const select = screen.getByRole('combobox', { name: 'Idioma' });
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Español', 'Català', 'English']);
    fireEvent.change(select, { target: { value: 'en' } });
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
    expect(document.documentElement.lang).toBe('en');
    act(() => setLocale('ca'));
    expect(select).toHaveValue('ca');
    expect(document.documentElement.lang).toBe('ca');
  });

  it('formats dates, numbers and plurals without changing user content', () => {
    const name = '<b>Vídeo My video</b>';
    for (const locale of ['es', 'ca', 'en'] as const) {
      setLocale(locale);
      expect(formatNumber(12345.5)).toBe(new Intl.NumberFormat(locale).format(12345.5));
      expect(formatDate('2026-11-25T12:00:00')).toBe(
        new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date('2026-11-25T12:00:00'))
      );
      expect(t('player.watch', { title: name })).toContain(name);
      expect(plural('player.views', 1)).toBe(translate('player.views.one', locale, { count: '1' }));
      expect(plural('player.views', 2)).toBe(translate('player.views.other', locale, { count: '2' }));
    }
    expect(formatDate('invalid')).toBe('');
  });

  it('uses controlled fallback for absent translations and unknown errors', () => {
    const original = ca['locale.label'];
    ca['locale.label'] = '';
    expect(translate('locale.label', 'ca')).toBe(es['locale.label']);
    ca['locale.label'] = original;
    expect(translate('unknown.key', 'en')).toBe(en['errors.generic']);
    setLocale('ca');
    expect(localizeMessage(en['errors.session'])).toBe(ca['errors.session']);
    expect(localizeMessage('SQL details')).toBe(ca['errors.generic']);
    expect(localizeMessage('')).toBe('');
    expect(fieldErrors({ email: 'raw validation' })).toEqual({ email: ca['errors.field'] });
    expect(fieldErrors()).toEqual({});
    expect(apiError('COMMENT_DELETED', 409, 'raw')).toBe(ca['errors.deletedComment']);
    expect(apiError('ACCOUNT_CREATED_SESSION_FAILED', 503, 'raw')).toBe(ca['errors.accountCreated']);
    expect(apiError(null, 401, 'raw')).toBe(ca['errors.session']);
    expect(apiError(null, 403, 'raw')).toBe(ca['errors.forbidden']);
    expect(apiError(null, 500, 'raw')).toBe(ca['errors.generic']);
  });

  it('translates built-in category labels while preserving unknown content and wire values', () => {
    const category = 'Gaming';
    setLocale('ca');
    expect(categoryLabel(category)).toBe('Videojocs');
    expect(categoryLabel('My custom category')).toBe('My custom category');
    expect(category).toBe('Gaming');
    expect(fieldErrors({ 'tags[0]': 'tag must be at most 80 characters' })).toEqual({
      'tags[0]': ca['errors.tagLength'],
    });
  });
});
