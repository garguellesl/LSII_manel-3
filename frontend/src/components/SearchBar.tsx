import { t, useLocale } from '../i18n/locale';
import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = t('catalogue.searchVideosByTitleOrDescription'),
}) => {
  useLocale();
  return (
    <div className="search-bar-container">
      <input
        type="search"
        role="searchbox"
        className="search-input"
        placeholder={placeholder}
        aria-label={t('catalogue.searchVideosByTitleOrDescriptionMessage')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          className="search-clear-button"
          aria-label={t('catalogue.clearSearch')}
          onClick={() => onChange('')}
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
