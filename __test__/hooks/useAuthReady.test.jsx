// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: false, query: {}, pathname: '/tools/builds/new', push: vi.fn(), replace: vi.fn() })
}));

const { AppContext } = await import('@components/common/context/AppProvider');
const { default: useAuthReady } = await import('@hooks/useAuthReady');

const GRACE_MS = 10;

const Probe = () => {
  const { authReady } = useAuthReady(GRACE_MS);
  return <span data-testid="probe">{String(authReady)}</span>;
};

const renderWithState = (state) => render(
  <AppContext.Provider value={{ state, dispatch: () => {} }}>
    <Probe/>
  </AppContext.Provider>
);

const pastTheGrace = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, GRACE_MS * 5));
});

describe('useAuthReady', () => {
  afterEach(() => localStorage.clear());

  it('falls back to the grace timer when no hint says the visitor was signed in', async () => {
    const { getByTestId } = renderWithState({ isLoading: true, signedIn: false });
    expect(getByTestId('probe').textContent).toBe('false');
    await pastTheGrace();
    expect(getByTestId('probe').textContent).toBe('true');
  });

  it('waits for a real answer instead of the timer when the hint says signed in', async () => {
    localStorage.setItem('authHint', 'yes');
    const { getByTestId } = renderWithState({ isLoading: true, signedIn: false });
    await pastTheGrace();
    expect(getByTestId('probe').textContent).toBe('false');
  });

  it('resolves with the hint once login finishes signed out', async () => {
    localStorage.setItem('authHint', 'yes');
    const { getByTestId } = renderWithState({ isLoading: false, signedIn: false });
    await pastTheGrace();
    expect(getByTestId('probe').textContent).toBe('true');
  });

  it('resolves with the hint as soon as the session comes back', async () => {
    localStorage.setItem('authHint', 'yes');
    const { getByTestId } = renderWithState({ isLoading: true, signedIn: true });
    await act(async () => {});
    expect(getByTestId('probe').textContent).toBe('true');
  });
});
