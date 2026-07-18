import { tryToParse } from '@utility/helpers';

const url = process.env.NEXT_PUBLIC_PROFILES_URL;
export const uploadProfile = async ({ profile, profileAccess, leaderboardParticipation }, token) => {
  try {
    const parsedProfile = parseProfile(profile);
    const response = await fetch(`${url}/profiles`, {
      method: 'POST',
      body: JSON.stringify({ profile: parsedProfile, profileAccess, leaderboardParticipation }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
    if (response?.status !== 200) {
      throw response;
    }
    return await response?.json();
  } catch (err) {
    console.error('Error has occurred: ', err);
    if (err?.status === 429) {
      throw 'You have uploaded your profile in the past 4 hours. Please wait until the cooldown is over.'
    } else if (err?.status === 500 || err?.status === 400) {
      throw 'An error has occurred while uploading your profile. Please try again later.'
    }
    throw 'An error has occurred while uploading your profile. Please try again later.';
  }
}

export const getProfile = async ({ mainChar }) => {
  try {
    const response = await fetch(`${url}/profiles/?profile=${encodeURIComponent(mainChar)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`profiles.js -> Error has occurred while getting profile for ${mainChar}`);
    throw e;
  }
}

export const fetchLeaderboard = async (leaderboard) => {
  try {
    const response = await fetch(`${url}/leaderboards?leaderboard=${leaderboard}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`profiles.js -> Error has occurred while getting leaderboards`);
    throw e;
  }
}

export const fetchUserLeaderboards = async (leaderboard, leaderboardUser) => {
  try {
    const response = await fetch(`${url}/leaderboards?leaderboard=${encodeURIComponent(leaderboard)}&leaderboardUser=${encodeURIComponent(leaderboardUser)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response) return null
    return await response?.json();
  } catch (e) {
    console.error(`profiles.js -> Error has occurred while getting leaderboards`);
    throw e;
  }
}

export const fetchTomePercentiles = async () => {
  try {
    const response = await fetch(`${url}/tome-percentiles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error('profiles.js -> Error fetching tome percentiles');
    return null;
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