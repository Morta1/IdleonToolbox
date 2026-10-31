import { LoginError } from '@utility/loginErrors';

const getAllUrlParams = (url) => {
  const params = new URL(url).searchParams;
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  if (result['openid.claimed_id']) {
    result.steamId = result['openid.claimed_id'].match(/\/(\d+)$/)?.[1];
  }
  return result;
}

const STEAM_SSO_PREFIX = 'https://www.legendsofidleon.com/steamsso/';
const REQUIRED_PARAMS = ['openid.claimed_id', 'openid.response_nonce', 'openid.sig', 'openid.signed'];

// Returns the url ready for getSteamParams, or throws a LoginError. Browsers hide "https://" in the
// address bar, so a partial selection loses it: an otherwise correct url gets it back silently.
const normalizeSteamUrl = (input) => {
  let url = input.trim();
  if (/^(www\.)?legendsofidleon\.com\/steamsso\//.test(url)) {
    url = `https://www.${url.replace(/^www\./, '')}`;
  }
  if (!url.startsWith('https://')) {
    throw new LoginError(url.startsWith('http') ? 'STEAM_URL_FORMAT' : 'STEAM_URL_NO_HTTPS');
  }
  if (!url.startsWith(STEAM_SSO_PREFIX)) {
    throw new LoginError('STEAM_URL_FORMAT');
  }
  let params;
  try {
    params = new URL(url).searchParams;
  } catch (e) {
    throw new LoginError('STEAM_URL_INVALID');
  }
  if (REQUIRED_PARAMS.some((key) => !params.get(key))) {
    throw new LoginError('STEAM_URL_INVALID');
  }
  return url;
}

// Throws a LoginError: NETWORK when the server can't be reached, STEAM_SERVER on a failed
// response, and STEAM_URL_REJECTED when it answers with no token. Steam urls are single-use, so a
// reused or stale one lands there, as does a valid url the server refuses.
const getSteamParams = async (url) => {
  const urlParams = getAllUrlParams(url);
  const data = {
    data: {
      claimedId: urlParams.steamId,
      nonce: urlParams['openid.response_nonce'],
      assocHandle: urlParams['openid.assoc_handle'],
      sig: urlParams['openid.sig'],
      signed: urlParams['openid.signed']
    }
  };
  let response;
  try {
    response = await fetch(`https://us-central1-idlemmo.cloudfunctions.net/asil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  } catch (e) {
    console.error('Error fetching Firebase token:', e);
    throw new LoginError('NETWORK');
  }
  if (!response.ok) {
    throw new LoginError('STEAM_SERVER', { status: response.status });
  }
  const json = await response.json().catch(() => null);
  const token = json?.result;
  if (!token || (typeof token === 'object' && Object.keys(token).length === 0)) {
    throw new LoginError('STEAM_URL_REJECTED');
  }
  return token;
}

export {
  normalizeSteamUrl,
  getSteamParams
}
