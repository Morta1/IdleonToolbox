export const uploadProfile = async ({ profile, uid }, token) => {
  try {
    // https://profiles.idleontoolbox.workers.dev
    // http://localhost:8787
    const response = await fetch('https://profiles.idleontoolbox.workers.dev/api/profiles', {
      method: 'POST',
      body: JSON.stringify({ profile, uid }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    return response;
  } catch (err) {
    console.error(`${__filename} -> Error has occurred while uploading profile`);
    throw err;
  }
}

export const getProfile = async ({ mainChar }) => {
  try {
    // https://profiles.idleontoolbox.workers.dev
    // http://localhost:8787
    const response = await fetch(`https://profiles.idleontoolbox.workers.dev/api/profiles/?profile=${mainChar}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`${__filename} -> Error has occurred while getting profile for ${mainChar}`);
    throw e;
  }
}