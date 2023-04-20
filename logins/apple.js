const appleAuthorize = async ({ device_code, h_nonce, statusToken }) => {
  const params = new URLSearchParams({
    client_id: "com.lavaflame.idleon.service.signin",
    nonce: h_nonce,
    redirect_uri: "https://us-central1-idlemmo.cloudfunctions.net/xapsi",
    response_mode: "form_post",
    response_type: "code id_token",
    scope: "email",
    code: device_code,
    state: statusToken
  })
  window.open(`https://appleid.apple.com/auth/authorize?${params.toString()}`, '_blank', 'popup');
}

const getAppleCode = async () => {
  const url = encodeURIComponent(`https://us-central1-idlemmo.cloudfunctions.net/tspa`);
  const codeRes = await fetch(`https://api.allorigins.win/raw?url=${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return await codeRes.json();
}

const geAppleStatus = async ({ device_code, statusToken }) => {
  const params = new URLSearchParams()
  params.append('device_code', device_code);
  params.append('statusToken', statusToken);
  const url = encodeURIComponent(`https://us-central1-idlemmo.cloudfunctions.net/capsc`);
  const codeRes = await fetch(`https://patient-dawn-9611.idleontoolboxappleauth.workers.dev/?url=${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  return await codeRes.json();
}

export {
  appleAuthorize,
  getAppleCode,
  geAppleStatus
}