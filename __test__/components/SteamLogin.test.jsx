// @vitest-environment jsdom
import '../../polyfills';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import theme from '../../styles/theme/theme';
import { AppContext } from '@components/common/context/AppProvider';

const { getSteamParams } = vi.hoisted(() => ({ getSteamParams: vi.fn(async () => 'token') }));
vi.mock('../../services/auth/steam', async (importOriginal) => ({ ...(await importOriginal()), getSteamParams }));
const SteamLogin = (await import('@components/common/Logins/SteamLogin')).default;

const SSO = 'https://www.legendsofidleon.com/steamsso/?openid.claimed_id=x%2F765&openid.response_nonce=n&openid.sig=s&openid.signed=signed';

const renderSteam = () => {
  const dispatch = vi.fn();
  render(
    <ThemeProvider theme={theme}>
      <AppContext.Provider value={{ state: {}, dispatch, waitingForAuth: false, setWaitingForAuth: vi.fn() }}>
        <SteamLogin/>
      </AppContext.Provider>
    </ThemeProvider>
  );
  return { dispatch, field: screen.getByLabelText('Steam page address') };
};

describe('SteamLogin', () => {
  it('signs in once on a pasted address', async () => {
    const { dispatch, field } = renderSteam();
    fireEvent.paste(field, { clipboardData: { getData: () => SSO } });
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'login', data: { loginData: { token: 'token' }, loginType: 'steam' } }));
    fireEvent.paste(field, { clipboardData: { getData: () => SSO } });
    expect(getSteamParams).toHaveBeenCalledTimes(1);
  });

  it('sends nothing while an address is typed, and names a partial one on blur', () => {
    getSteamParams.mockClear();
    const { field } = renderSteam();
    fireEvent.change(field, { target: { value: 'www.legendsofidleon.com/steamsso/' } });
    expect(screen.queryByText(/^Incomplete Steam page address\./)).toBeNull();
    fireEvent.blur(field);
    expect(screen.getByText(/^Incomplete Steam page address\./)).toBeTruthy();
    expect(getSteamParams).not.toHaveBeenCalled();
  });
});
