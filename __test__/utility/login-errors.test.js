import { describe, it, expect } from 'vitest';
import { LoginError, toLoginError } from '../../utility/loginErrors';
import { normalizeSteamUrl } from '../../services/auth/steam';

const QUERY = '?openid.claimed_id=x%2F765&openid.response_nonce=n&openid.sig=s&openid.signed=signed';
const SSO = `https://www.legendsofidleon.com/steamsso/${QUERY}`;

describe('toLoginError', () => {
  it.each([
    [new LoginError('STEAM_SERVER', { status: 503 }), 'STEAM_SERVER', 'Login server error (503)'],
    [Object.assign(new Error('x'), { code: 'auth/user-disabled' }), 'ACCOUNT_DISABLED', 'This account is disabled'],
    [new TypeError('Failed to fetch'), 'NETWORK', 'Couldn\'t connect'],
    [Object.assign(new Error('x'), { code: 'auth/internal-error' }), 'UNKNOWN', 'Login failed (auth/internal-error)']
  ])('%#', (error, code, message) => {
    expect(toLoginError(error)).toMatchObject({ code, message });
  });
});

describe('normalizeSteamUrl', () => {
  it.each([
    [`www.legendsofidleon.com/steamsso/${QUERY}`, SSO],
    [`legendsofidleon.com/steamsso/${QUERY}`, SSO],
    [` ${SSO} `, SSO]
  ])('fixes %s', (input, expected) => {
    expect(normalizeSteamUrl(input)).toBe(expected);
  });

  it.each([
    ['steamcommunity.com/openid', 'STEAM_URL_NO_HTTPS'],
    ['http://www.legendsofidleon.com/steamsso/', 'STEAM_URL_FORMAT'],
    ['https://www.legendsofidleon.com/', 'STEAM_URL_FORMAT'],
    ['https://www.legendsofidleon.com/steamsso/?openid.sig=s', 'STEAM_URL_INVALID']
  ])('rejects %s', (input, code) => {
    expect(() => normalizeSteamUrl(input)).toThrow(expect.objectContaining({ code }));
  });
});
