import { useState } from 'react';
import axios from 'axios';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TagSearch } from '../TagSearch';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function Filters({ initial = [] }: { initial?: string[] }) {
  const [tags, setTags] = useState(initial);
  return <TagSearch tags={tags} onChange={setTags} />;
}

describe('TagSearch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedAxios.get.mockResolvedValue({ data: ['rock', 'abba', 'pop'] });
  });

  it('loads only when opened, sorts options, filters locally and preserves selections when closing', async () => {
    render(<Filters />);
    const trigger = screen.getByRole('button', { name: 'Tags' });
    expect(mockedAxios.get).not.toHaveBeenCalled();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('status')).toHaveTextContent('Loading tags');
    const search = screen.getByRole('searchbox', { name: 'Find a tag' });
    expect(search).toHaveFocus();
    await screen.findByRole('checkbox', { name: 'rock' });
    expect(screen.getAllByRole('checkbox').map((item) => item.closest('label')?.textContent)).toEqual([
      'abba',
      'pop',
      'rock',
    ]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'rock' }));
    expect(trigger).toHaveTextContent('Tags (1)');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    fireEvent.change(search, { target: { value: ' AB ' } });
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    fireEvent.click(screen.getByRole('checkbox', { name: 'abba' }));
    expect(trigger).toHaveTextContent('Tags (2)');
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(search, { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(await screen.findByRole('checkbox', { name: 'rock' })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: 'rock' }));
    expect(screen.getByRole('checkbox', { name: 'rock' })).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Clear tag filters' }));
    expect(screen.getByRole('checkbox', { name: 'abba' })).not.toBeChecked();
    expect(trigger).toHaveTextContent(/^Tags$/);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('region', { name: 'Tag filters' })).not.toBeInTheDocument();
  });

  it('shows empty options and local search without matches', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    render(<Filters />);
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    await screen.findByText('No tags are available.');
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    await screen.findByRole('checkbox', { name: 'rock' });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'missing' } });
    expect(screen.getByRole('status')).toHaveTextContent('No tags match your search.');
  });

  it('supports retry after a failed request and cancels when closed', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('offline'));
    render(<Filters />);
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load tags.');
    fireEvent.click(screen.getByRole('button', { name: 'Retry tags' }));
    await screen.findByRole('checkbox', { name: 'rock' });
    const signal = mockedAxios.get.mock.calls[1][1]?.signal;
    fireEvent.pointerDown(document.body);
    expect(signal?.aborted).toBe(true);
  });

  it('ignores responses from a closed panel', async () => {
    let resolve!: (value: unknown) => void;
    mockedAxios.get.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    render(<Filters />);
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    fireEvent.pointerDown(document.body);
    fireEvent.click(screen.getByRole('button', { name: 'Tags' }));
    await screen.findByRole('checkbox', { name: 'rock' });
    await act(async () => resolve({ data: ['obsolete'] }));
    expect(screen.queryByRole('checkbox', { name: 'obsolete' })).not.toBeInTheDocument();
  });

  it('limits selections to 40 while allowing deselection', async () => {
    const initial = Array.from({ length: 40 }, (_, i) => `tag${i}`);
    mockedAxios.get.mockResolvedValue({ data: [...initial, 'extra'] });
    render(<Filters initial={initial} />);
    fireEvent.click(screen.getByRole('button', { name: 'Tags (40)' }));
    expect(await screen.findByRole('checkbox', { name: 'extra' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('at most 40');
    fireEvent.click(screen.getByRole('checkbox', { name: 'tag0' }));
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'extra' })).toBeEnabled());
    fireEvent.click(screen.getByRole('checkbox', { name: 'extra' }));
    expect(screen.getByRole('button', { name: 'Tags (40)' })).toBeInTheDocument();
  });
});
