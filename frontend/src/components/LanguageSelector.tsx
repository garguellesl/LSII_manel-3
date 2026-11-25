import { setLocale, t, useLocale } from '../i18n/locale';
import type { Locale } from '../i18n/locale';

export function LanguageSelector() {
  const locale = useLocale();
  return (
    <label className="language-selector">
      <span>{t('locale.label')}</span>
      <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
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
    </label>
  );
}
