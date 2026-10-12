import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, placeholder = 'Search videos by title...' }) => {
  return (
    <div className="search-bar-container">
      <input
        type="search"
        role="searchbox"
        className="search-input"
        placeholder={placeholder}
        aria-label="Search videos by title"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" className="search-clear-button" aria-label="Clear search" onClick={() => onChange('')}>
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
