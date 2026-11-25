import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../auth/AuthContext';
import type { AuthValue } from '../../auth/AuthContext';
import { subscriptionClient } from '../../utils/subscriptionClient';
import { subscriptionMessages } from '../../utils/subscriptionMessages';
import { CreatorSubscription } from '../CreatorSubscription';

jest.mock('../../utils/subscriptionClient', () => ({
  subscriptionClient: { state: jest.fn(), setSubscribed: jest.fn() },
}));

const api = jest.mocked(subscriptionClient);
const auth: AuthValue = {
  status: 'authenticated',
  error: null,
  user: {
    id: 1,
    accountName: 'ada',
    email: 'ada@example.test',
    firstName: 'Ada',
    lastName: 'Lovelace',
    createdAt: '',
    displayName: 'Ada',
    description: null,
    avatarUrl: null,
  },
  refresh: jest.fn(),
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  updateUser: jest.fn(),
};

function renderControl(creatorId: number) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={auth}>
        <CreatorSubscription creatorId={creatorId} />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('CreatorSubscription', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('keeps the previous state on mutation failure and updates it only after confirmation', async () => {
    api.state.mockResolvedValue({ subscribed: false });
    api.setSubscribed.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce(undefined);
    renderControl(2);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando');

    const subscribe = await screen.findByRole('button', { name: 'Suscribirme', exact: true });
    fireEvent.click(subscribe);
    expect(subscribe).toBeDisabled();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido cambiar');
    expect(subscribe).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(subscribe);

    const unsubscribe = await screen.findByRole('button', { name: 'Cancelar suscripción' });
    expect(unsubscribe).toHaveAttribute('aria-pressed', 'true');
    expect(api.setSubscribed).toHaveBeenLastCalledWith(2, true, expect.any(AbortSignal));
    api.setSubscribed.mockResolvedValueOnce(undefined);
    fireEvent.click(unsubscribe);
    await waitFor(() => expect(api.setSubscribed).toHaveBeenLastCalledWith(2, false, expect.any(AbortSignal)));
    expect(await screen.findByRole('button', { name: 'Suscribirme', exact: true })).toBeEnabled();
  });

  it('hides the mutation for the signed-in creator and localizes the feature by language preference', () => {
    renderControl(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(api.state).not.toHaveBeenCalled();
    expect(subscriptionMessages(['ca-ES', 'es']).subscriptions).toBe('Les meves subscripcions');
    expect(subscriptionMessages(['fr-FR', 'es-ES']).subscribe).toBe('Suscribirme');
    expect(subscriptionMessages(['fr-FR']).subscriptions).toBe('Mis suscripciones');
  });
});
