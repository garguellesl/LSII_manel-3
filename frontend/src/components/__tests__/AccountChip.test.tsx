import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AccountChip } from '../AccountChip';
import { useAuth } from '../../auth/AuthContext';

jest.mock('../../auth/AuthContext', () => ({ useAuth: jest.fn() }));

const mockedAuth = useAuth as jest.Mock;
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

function renderChip() {
  return render(
    <MemoryRouter>
      <AccountChip />
    </MemoryRouter>
  );
}

describe('AccountChip', () => {
  it('shows only a login link for an anonymous visitor', () => {
    mockedAuth.mockReturnValue({ status: 'anonymous', user: null });
    renderChip();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the avatar only, and opens the account details and edit action on click', () => {
    mockedAuth.mockReturnValue({ status: 'authenticated', user, signOut: jest.fn() });
    renderChip();
    const button = screen.getByRole('button', { name: 'Cuenta de Ana P.' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('@ana')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toHaveAttribute('href', '/profile');
    expect(screen.getByRole('link', { name: 'Mis suscripciones' })).toHaveAttribute('href', '/subscriptions');
  });

  it('signs out from the panel and keeps the panel closed on Escape', () => {
    const signOut = jest.fn().mockResolvedValue(undefined);
    mockedAuth.mockReturnValue({ status: 'authenticated', user, signOut });
    renderChip();
    fireEvent.click(screen.getByRole('button', { name: 'Cuenta de Ana P.' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('ana@example.com')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cuenta de Ana P.' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(signOut).toHaveBeenCalled();
  });
});
