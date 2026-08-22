// Safari (and every iOS browser, they're all WKWebView) only allows window.open from inside the
// click handler itself, so the popup is opened empty on click and pointed at apple once the
// device code arrives.
const openAuthPopup = () => window.open('', '_blank', 'popup');

const appleAuthorize = async ({ device_code, h_nonce, statusToken }, popup) => {
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
  const url = `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  if (popup && !popup.closed) {
    popup.location.href = url;
  } else {
    window.open(url, '_blank', 'popup');
  }
}

const getAppleCode = async () => {
  const url = encodeURIComponent(`https://us-central1-idlemmo.cloudfunctions.net/tspa`);
  const codeRes = await fetch(`https://appleauth.idleontoolbox.workers.dev/?url=${url}`, {
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
  const codeRes = await fetch(`https://appleauth.idleontoolbox.workers.dev/?url=${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  })
  return await codeRes.json();
}

export {
  openAuthPopup,
  appleAuthorize,
  getAppleCode,
  geAppleStatus
}
