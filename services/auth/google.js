const getUserAndDeviceCode = async () => {
  const getCodeRes = await fetch("https://oauth2.googleapis.com/device/code", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: "client_id=267901585099-u6fjd75v6k9gefq7bcokcndv99riir5j&scope=email profile"
  });
  return await getCodeRes.json();
}

const getUserToken = async (deviceCode) => {
  try {
    const getDeviceResult = `client_id=267901585099-u6fjd75v6k9gefq7bcokcndv99riir5j&client_secret=HzoZF-UKUNfFwBuz4vafwsaR&device_code=${deviceCode}&grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Adevice_code`
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: getDeviceResult
    })
    return await res.json();
  } catch (err) {
    console.error('Error has occurred while trying to authenticate:', err);
  }
}

export {
  getUserAndDeviceCode,
  getUserToken
}