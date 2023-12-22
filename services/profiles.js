import { tryToParse } from '../utility/helpers';

const url = 'https://profiles.idleontoolbox.workers.dev/api/profiles';
// const url = 'http://localhost:8787/api/profiles';
export const uploadProfile = async ({ profile, uid }, token) => {
  try {
    // https://profiles.idleontoolbox.workers.dev
    // http://localhost:8787
    const parsedProfile = parseProfile(profile);
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ profile: parsedProfile, uid }),
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
    const response = await fetch(`${url}/?profile=${mainChar}`, {
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

const parseProfile = (profile) => {
  const data = Object.entries(profile.data).reduce((acc, [key, value]) => {
    acc[key] = tryToParse(value);
    return acc;
  }, {});
  return {
    ...profile,
    data
  }
}