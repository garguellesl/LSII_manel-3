import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountMenu } from '../AccountMenu';
import { AuthContext, type AuthValue } from '../../auth/AuthContext';

const user = {
  id: 7,
  email: 'ana@example.com',
  accountName: 'ana',
  firstName: 'Ana',
  lastName: 'Pérez',
  createdAt: '2026-01-01T00:00:00Z',
  displayName: 'Ana P.',
  description: null,
  avatarUrl: null,
};

function renderMenu(overrides: Partial<AuthValue> = {}) {
  const value = {
    status: 'authenticated',
    user,
    error: null,
    refresh: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn().mockResolvedValue(undefined),
    updateUser: jest.fn(),
    ...overrides,
  } as AuthValue;
  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/videos/1']}>
        <AccountMenu />
      </MemoryRouter>
    </AuthContext.Provider>
  );
  return value;
}

describe('AccountMenu on non-catalogue pages', () => {
  it('shows a single + for adding videos and the avatar, with the actions behind them', () => {
    renderMenu();
    expect(screen.queryByRole('link', { name: 'Subir vídeo' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Añadir vídeo' }));
    expect(screen.getByRole('link', { name: 'Subir vídeo' })).toHaveAttribute('href', '/upload');
    expect(screen.getByRole('link', { name: 'Registrar vídeo existente' })).toHaveAttribute('href', '/videos/new');
  });

  it('opens the avatar panel with subscriptions and logout, and signs out from it', async () => {
    const value = renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Cuenta de Ana P.' }));
    expect(screen.getByRole('link', { name: 'Mis suscripciones' })).toHaveAttribute('href', '/subscriptions');
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(value.signOut).toHaveBeenCalled();
  });

  it('closes an open panel with Escape', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Cuenta de Ana P.' }));
    expect(screen.getByRole('link', { name: 'Mis suscripciones' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('link', { name: 'Mis suscripciones' })).not.toBeInTheDocument();
  });
});
