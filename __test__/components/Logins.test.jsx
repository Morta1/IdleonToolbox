// @vitest-environment jsdom
import '../../polyfills';
import React, { useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

// A static route, so the anonymous visitor below settles without parsing anything.
vi.mock('next/router', () => ({
  useRouter: () => ({ isReady: true, query: {}, pathname: '/wiki/[kind]/[slug]', push: () => {}, replace: () => {} })
}));
vi.mock('@parsers/index', () => ({ parseData: () => ({ account: {}, characters: [] }) }));

// Every sign-in service is a stub: no test here talks to google, apple or firebase.
const firebase = vi.hoisted(() => ({
  subscribe: vi.fn(async () => () => {}),
  signInWithToken: vi.fn(async () => ({ uid: 'uid' })),
  signInWithEmailPassword: vi.fn(async () => ({ accessToken: 'email-token', uid: 'uid' })),
  checkUserStatus: vi.fn(async () => null),
  userSignOut: vi.fn(async () => {})
}));
vi.mock('../../firebase/lazy', () => ({ loadFirebase: async () => firebase, firebaseRequested: () => false }));
const google = vi.hoisted(() => ({
  getUserToken: vi.fn(async () => ({ id_token: 'google-token' })),
  getUserAndDeviceCode: vi.fn()
}));
vi.mock('../../services/auth/google', () => google);
vi.mock('../../services/auth/apple', () => ({
  geAppleStatus: async () => ({ id_token: 'apple-token' }),
  appleAuthorize: async () => {},
  getAppleCode: async () => ({}),
  openAuthPopup: () => null
}));

const { default: AppProvider, AppContext } = await import('@components/common/context/AppProvider');
const { default: GoogleLogin } = await import('@components/common/Logins/GoogleLogin');
const { default: EmailLogin } = await import('@components/common/Logins/EmailLogin');

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('authHint', 'no');
  window.gtag = vi.fn();
});

afterEach(() => {
  delete window.gtag;
});

describe('the GA login event', () => {
  const context = { current: null };
  const Probe = () => {
    context.current = useContext(AppContext);
    return null;
  };

  it.each([
    ['email', 'email-password', { accessToken: 'email-token', uid: 'uid' }],
    ['apple', 'apple', {}],
    ['google', 'google', { deviceCode: 'device' }]
  ])('reports %s sign-ins as %s', async (loginType, label, loginData) => {
    render(<AppProvider><Probe/></AppProvider>);
    await waitFor(() => expect(context.current.state.isLoading).toBe(false));

    act(() => {
      context.current.dispatch({ type: 'login', data: { loginType, loginData } });
      context.current.setWaitingForAuth(true);
    });

    await waitFor(() => expect(window.gtag).toHaveBeenCalledWith('event', 'login', expect.anything()), { timeout: 3000 });
    expect(window.gtag.mock.calls.find(([, name]) => name === 'login')[2].value).toBe(label);
  });
});

describe('GoogleLogin', () => {
  const renderGoogle = () => {
    const dispatch = vi.fn();
    const setWaitingForAuth = vi.fn();
    const view = render(
      <AppContext.Provider value={{ state: {}, dispatch, setWaitingForAuth }}>
        <GoogleLogin/>
      </AppContext.Provider>
    );
    return { dispatch, setWaitingForAuth, view };
  };
  const code = { user_code: 'ABCD-EFGH', device_code: 'device', expires_in: 1800 };

  it('ignores a device code that arrives after the dialog closed', async () => {
    let resolveCode;
    google.getUserAndDeviceCode.mockReturnValueOnce(new Promise((resolve) => (resolveCode = resolve)));
    const { dispatch, setWaitingForAuth, view } = renderGoogle();

    view.unmount();
    await act(async () => resolveCode(code));

    expect(dispatch).not.toHaveBeenCalled();
    expect(setWaitingForAuth.mock.calls).toEqual([[false]]);
  });

  it('stops the auth poll when the dialog closes mid sign-in', async () => {
    google.getUserAndDeviceCode.mockResolvedValueOnce(code);
    const { setWaitingForAuth, view } = renderGoogle();
    await waitFor(() => expect(setWaitingForAuth).toHaveBeenCalledWith(true));

    view.unmount();

    expect(setWaitingForAuth.mock.calls).toEqual([[true], [false]]);
  });
});

describe('EmailLogin', () => {
  const renderEmail = () => render(
    <AppContext.Provider value={{ state: {}, dispatch: vi.fn(), waitingForAuth: false, setWaitingForAuth: vi.fn() }}>
      <EmailLogin/>
    </AppContext.Provider>
  );

  it('lets password managers fill both fields', () => {
    const { container } = renderEmail();
    const autocomplete = [...container.querySelectorAll('input')].map((input) => [input.name, input.autocomplete]);
    expect(autocomplete).toEqual([['email', 'email'], ['password', 'current-password']]);
  });

  it.each(['Enter', 'NumpadEnter'])('submits on the %s key', async (code) => {
    firebase.signInWithEmailPassword.mockClear();
    const { container } = renderEmail();
    const [email, password] = container.querySelectorAll('input');
    fireEvent.change(email, { target: { name: 'email', value: 'player@example.com' } });
    fireEvent.change(password, { target: { name: 'password', value: 'hunter2' } });

    fireEvent.keyDown(password, { key: 'Enter', code });

    await waitFor(() => expect(firebase.signInWithEmailPassword)
      .toHaveBeenCalledWith({ email: 'player@example.com', password: 'hunter2' }));
  });
});
