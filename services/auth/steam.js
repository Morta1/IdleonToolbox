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
  try {
    const response = await fetch(`https://us-central1-idlemmo.cloudfunctions.net/asil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    const json = await response.json();
    return json.result;
  } catch (e) {
    console.error('Error fetching Firebase token:', e);
    return { error: true, message: e?.message };
  }
}

export {
  getSteamParams
}