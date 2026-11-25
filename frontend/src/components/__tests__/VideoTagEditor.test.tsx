import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VideoTagEditor } from '../VideoTagEditor';
import { AuthError } from '../../utils/authClient';
import { videoClient } from '../../utils/videoClient';

jest.mock('../../utils/videoClient', () => ({
  ...jest.requireActual('../../utils/videoClient'),
  videoClient: { updateTags: jest.fn() },
}));
const client = videoClient as jest.Mocked<typeof videoClient>;

const video = (tags: string[]) => ({
  id: 7,
  title: 'Uptown Funk',
  user: 'Mark Ronson',
  description: '',
  duration: 79,
  thumbnailUrl: '/media/7.webp',
  videoUrl: '/media/7.mp4',
  tags,
});

describe('VideoTagEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows tags read-only without edit controls when not editable', () => {
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable={false} onTagsSaved={jest.fn()} />);

    expect(screen.getByText('funk')).toBeInTheDocument();
    expect(screen.getByText('pop')).toBeInTheDocument();
    expect(screen.queryByLabelText('Añadir etiqueta')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Eliminar etiqueta funk')).not.toBeInTheDocument();
  });

  it('shows the add input, counter and remove buttons when editable', () => {
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={jest.fn()} />);

    expect(screen.getByLabelText('Añadir etiqueta')).toBeInTheDocument();
    expect(screen.getByText('2/40 Etiquetas')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar etiqueta funk')).toBeInTheDocument();
    expect(screen.getByLabelText('Eliminar etiqueta pop')).toBeInTheDocument();
  });

  it('adds a tag by pressing Enter and reports the saved list', async () => {
    client.updateTags.mockResolvedValue(video(['funk', 'house', 'pop']));
    const onTagsSaved = jest.fn();
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={onTagsSaved} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'house' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => expect(onTagsSaved).toHaveBeenCalledWith(['funk', 'house', 'pop']));
    expect(client.updateTags).toHaveBeenCalledWith(7, ['funk', 'pop', 'house']);
    expect(input).toHaveValue('');
  });

  it('adds a tag by typing a trailing comma', async () => {
    client.updateTags.mockResolvedValue(video(['funk', 'house', 'pop']));
    const onTagsSaved = jest.fn();
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={onTagsSaved} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'house,' } });

    await waitFor(() => expect(onTagsSaved).toHaveBeenCalledWith(['funk', 'house', 'pop']));
    expect(client.updateTags).toHaveBeenCalledWith(7, ['funk', 'pop', 'house']);
  });

  it('ignores a case-insensitive duplicate without calling the backend', () => {
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={jest.fn()} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'FUNK' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(client.updateTags).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
  });

  it('blocks adding a 41st tag locally without calling the backend', () => {
    const fortyTags = Array.from({ length: 40 }, (_, index) => `tag${index}`);
    render(<VideoTagEditor videoId={7} tags={fortyTags} editable onTagsSaved={jest.fn()} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'one-too-many' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(client.updateTags).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Puedes tener como máximo 40 etiquetas.');
    expect(input).toHaveValue('one-too-many');
  });

  it('removes a tag via its accessible button and reports the saved list', async () => {
    client.updateTags.mockResolvedValue(video(['pop']));
    const onTagsSaved = jest.fn();
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={onTagsSaved} />);

    fireEvent.click(screen.getByLabelText('Eliminar etiqueta funk'));

    expect(client.updateTags).toHaveBeenCalledWith(7, ['pop']);
    await waitFor(() => expect(onTagsSaved).toHaveBeenCalledWith(['pop']));
  });

  it('disables controls and shows a saving indicator while a save is in flight', async () => {
    let resolveSave!: (value: ReturnType<typeof video>) => void;
    client.updateTags.mockReturnValue(new Promise((resolve) => (resolveSave = resolve)));
    const onTagsSaved = jest.fn();
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={onTagsSaved} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'house' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Guardando…')).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(screen.getByLabelText('Eliminar etiqueta funk')).toBeDisabled();

    resolveSave(video(['funk', 'house', 'pop']));
    await waitFor(() => expect(onTagsSaved).toHaveBeenCalledWith(['funk', 'house', 'pop']));
  });

  it('renders a per-tag validation error next to the input and keeps the draft', async () => {
    client.updateTags.mockRejectedValue(
      new AuthError('Invalid', { 'tags[2]': 'tag must be at most 80 characters' }, 400)
    );
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={jest.fn()} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'a'.repeat(81) } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByText('Cada etiqueta puede tener como máximo 80 caracteres.')).toBeInTheDocument();
    expect(screen.queryByText('tag must be at most 80 characters')).not.toBeInTheDocument();
    expect(input).toHaveValue('a'.repeat(81));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a network failure distinctly from a validation error', async () => {
    client.updateTags.mockRejectedValue(new Error('Network Error'));
    render(<VideoTagEditor videoId={7} tags={['funk', 'pop']} editable onTagsSaved={jest.fn()} />);

    const input = screen.getByLabelText('Añadir etiqueta');
    fireEvent.change(input, { target: { value: 'house' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Error de conexión. Inténtalo de nuevo.');
  });
});
