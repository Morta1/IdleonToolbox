import { tryToParse } from '../utility/helpers';

// const url = 'https://profiles.idleontoolbox.workers.dev/api';
const url = 'http://localhost:8787/api';
export const uploadProfile = async ({ profile, uid, leaderboardConsent }, token) => {
  try {
    const parsedProfile = parseProfile(profile);
    const response = await fetch(`${url}/profiles`, {
      method: 'POST',
      body: JSON.stringify({ profile: parsedProfile, uid, leaderboardConsent }),
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
    const response = await fetch(`${url}/profiles/?profile=${mainChar}`, {
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

export const fetchLeaderboards = async () => {
  try {
    const response = await fetch(`${url}/leaderboards`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`${__filename} -> Error has occurred while getting leaderboards`);
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