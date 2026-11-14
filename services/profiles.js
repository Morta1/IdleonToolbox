import { tryToParse } from '@utility/helpers';

const url = process.env.NEXT_PUBLIC_PROFILES_URL;
// kind: what failed, for the upload analytics: cooldown (429), auth (401), server (other statuses), network (no answer),
// client (anything before the request).
export class UploadError extends Error {
  constructor(kind, message, status = null) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

const GENERIC_UPLOAD_ERROR = 'An error has occurred while uploading your profile. Please try again later.';

export const uploadProfile = async ({ profile, profileAccess, leaderboardParticipation }, token) => {
  let body;
  try {
    body = JSON.stringify({ profile: parseProfile(profile), profileAccess, leaderboardParticipation });
  } catch (err) {
    console.error('Error has occurred: ', err);
    throw new UploadError('client', GENERIC_UPLOAD_ERROR);
  }
  let response;
  try {
    response = await fetch(`${url}/profiles`, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      }
    });
  } catch (err) {
    console.error('Error has occurred: ', err);
    throw new UploadError('network', 'Could not reach the server. Check your connection and try again.');
  }
  if (response.status === 200) return await response.json();
  if (response.status === 429) {
    throw new UploadError('cooldown', 'You have uploaded your profile in the past hour. Please wait until the cooldown is over.', 429);
  }
  if (response.status === 401) {
    throw new UploadError('auth', 'Your sign-in was not accepted. Sign out, sign in again and upload.', 401);
  }
  throw new UploadError('server', GENERIC_UPLOAD_ERROR, response.status);
}

// null is the worker's answer that no such profile exists. Anything else that isn't a save throws: no answer, a 5xx, or
// a 403, whose JSON { error } would otherwise be parsed as a save.
export const getProfile = async ({ mainChar }) => {
  try {
    const response = await fetch(`${url}/profiles/?profile=${encodeURIComponent(mainChar)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`The profile api answered ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error(`profiles.js -> Error has occurred while getting profile for ${mainChar}`);
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