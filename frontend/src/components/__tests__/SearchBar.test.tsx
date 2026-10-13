import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from '../SearchBar';

describe('SearchBar', () => {
  it('renders search input with accessible role and placeholder', () => {
    render(<SearchBar value="" onChange={jest.fn()} />);

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', 'Search videos by title...');
    expect(searchInput).toHaveValue('');
  });

  it('calls onChange when user types in the input', () => {
    const handleChange = jest.fn();
    render(<SearchBar value="" onChange={handleChange} />);

    const searchInput = screen.getByRole('searchbox', { name: /search videos by title/i });
    fireEvent.change(searchInput, { target: { value: 'Tutorial' } });

    expect(handleChange).toHaveBeenCalledWith('Tutorial');
  });

  it('renders clear button when value is not empty and clears input on click', () => {
    const handleChange = jest.fn();
    render(<SearchBar value="hello" onChange={handleChange} />);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    fireEvent.click(clearButton);
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not render clear button when value is empty', () => {
    render(<SearchBar value="" onChange={jest.fn()} />);

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();
  });
});
