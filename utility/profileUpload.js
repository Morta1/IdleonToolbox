import { expandLeaderboardInfo } from '../services/leaderboardInfo';
import { UploadError, uploadProfile } from '../services/profiles';
import { currentToken } from '../firebase/lazy';

// Loaded on demand (useProfileUpload): the board values pull in the parsers, which must not ship with every page.

const GEM_KEYS = ['GemsOwned', 'ServerGems', 'ServerGemsReceived', 'BundlesReceived', 'GemsPacksPurchased', 'CYGems'];

// One upload of the save loaded in this tab. Throws an UploadError; answers { anonId?, autoUploadHours }.
export const sendProfile = async ({ account, characters, accessToken, profileAccess, leaderboardParticipation, removeGems, trigger }) => {
  // A save that cannot be read or parsed is a failure the upload analytics must see too, so it throws like the rest.
  let userData;
  try {
    userData = JSON.parse(sessionStorage.getItem('rawJson'));
  } catch {
    userData = null;
  }
  if (!userData?.data) throw new UploadError('client', 'Your save is not loaded in this tab. Reload the page and try again.');
  if (removeGems) for (const key of GEM_KEYS) delete userData.data[key];
  const parsedData = expandLeaderboardInfo(account, characters);
  const { token, source } = await currentToken(accessToken);
  return uploadProfile({ profile: { ...userData, parsedData }, profileAccess, leaderboardParticipation, trigger }, token, source);
};
