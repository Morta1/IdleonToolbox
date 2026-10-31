import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { child, get, getDatabase, goOnline, query, ref } from 'firebase/database';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query as fsQuery
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import app from './config';
import { tryToParse } from '@utility/helpers';
import { LoginError } from '@utility/loginErrors';

const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

const signInWithToken = async (token, type) => {
  try {
    let credential;
    if (type === 'apple') {
      const provider = new OAuthProvider('apple.com');
      credential = provider.credential({
        idToken: token?.id_token,
        rawNonce: token?.nonce
      });
    } else if (type === 'google') {
      credential = GoogleAuthProvider.credential(token, null);
    }

    const result = await signInWithCredential(auth, credential);
    return result?.user;
  } catch (error) {
    console.error('Error while trying to sign in with credentials:', error);
    throw error;
  }
};

const WRONG_CREDENTIAL_CODES = ['auth/invalid-email', 'auth/user-not-found', 'auth/invalid-password',
  'auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'];

const signInWithEmailPassword = async ({ email, password } = {}) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result?.user;
  } catch (error) {
    // Firebase reports a wrong password as auth/invalid-credential since email enumeration
    // protection, and as the older codes on projects without it.
    if (WRONG_CREDENTIAL_CODES.includes(error.code)) {
      throw new LoginError('EMAIL_WRONG_CREDENTIALS');
    }
    console.error('Error while trying to sign in with credentials:', error);
    throw error;
  }
};

const signInWithCustom = async (token) => {
  if (!token) return;
  const result = await signInWithCustomToken(auth, token);
  return result?.user;
};

const checkUserStatus = () => {
  return new Promise((resolve, reject) => {
    try {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user ?? null);
      });
    } catch (err) {
      reject(err);
    }
  });
};

const subscribe = async (uid, accessToken, callback) => {
  goOnline(database);
  const dbRef = ref(database);

  // Independent bootstrap reads, fetched concurrently. The cloudsave itself is
  // deliberately NOT fetched here - the onSnapshot below delivers the same document,
  // and a getDoc first would download the full save twice per login (and prime the
  // SDK cache into an extra cache-then-server listener firing).
  let charNames, serverVarsDoc, tournamentDoc;
  try {
    [charNames, serverVarsDoc, tournamentDoc] = await Promise.all([
      getSnapshot(dbRef, `_uid/${uid}`, { throwOnError: true }),
      getDoc(doc(firestore, '_vars', '_vars')),
      getDoc(doc(firestore, '_TOURNAMENT', '_TOURNAMENT'))
    ]);
  } catch (error) {
    console.error('Error while loading the save:', error);
    throw new LoginError('SAVE_LOAD_FAILED');
  }

  if (!charNames || charNames?.length === 0) {
    throw new LoginError('NO_CHARACTERS');
  }

  let serverVars;
  if (serverVarsDoc.exists()) {
    serverVars = serverVarsDoc.data();
  }

  let tournamentData;
  if (tournamentDoc.exists()) {
    tournamentData = tournamentDoc.data();
  }

  // No includeMetadataChanges: the callback never reads snapshot metadata, and the
  // flag delivers metadata-only confirmations that each re-run the five side fetches
  // and a full account parse.
  return onSnapshot(
    doc(firestore, '_data', uid),
    async (docSnapshot) => {
      if (!docSnapshot.exists()) return;

      const cloudsave = docSnapshot.data();
      const createTime = docSnapshot._document?.createTime?.toTimestamp();

      const [companion, guildId, tournamentUser, tournamentMatchData, tournamentGlobal] = await Promise.all([
        getSnapshot(dbRef, `_comp/${uid}`),
        getSnapshot(dbRef, `_usgu/${uid}/g`),
        getSnapshot(dbRef, `_tournament/${uid}`),
        getDoc(doc(firestore, '_T_RES_UID', uid)).then((d) => (d?.exists() ? d.data() : null)),
        // Re-fetch the global tournament doc on every snapshot. It holds the server's
        // shop-day (S) counter, which advances daily. Reusing the value cached at subscribe
        // time made the shop-day go stale across a daily reset, so the Pet Mart gems alert
        // silently stopped triggering even when gems were claimable.
        getDoc(doc(firestore, '_TOURNAMENT', '_TOURNAMENT')).then((d) => (d?.exists() ? d.data() : null)),
      ]);

      const guild = guildId ? await getSnapshot(dbRef, `_guild/${guildId}`) : null;

      const guildData = {
        id: guildId,
        stats: tryToParse(cloudsave?.Guild),
        members: Object.values(guild?.m || {}),
        points: guild?.p
      };

      const tournament = {
        user: tournamentUser,
        match: tournamentMatchData,
        global: tournamentGlobal ?? tournamentData,
        leaderboard: []
      };

      callback(
        cloudsave,
        charNames,
        companion,
        guildData,
        tournament,
        serverVars,
        createTime,
        uid,
        accessToken
      );
    },
    (err) => {
      console.error('Error occurred in subscribe listener:', err);
    }
  );
};

export const getLeaderboard = async (divisionIndex) => {
  try {
    const snapshot = await getDoc(doc(firestore, '_T_LEAD', 'T' + divisionIndex));
    return snapshot?.exists() ? snapshot.data()?.d : [];
  } catch (e) {
    console.error('Error fetching leaderboard:', e);
    return [];
  }
};

export const getGuilds = async (callback) => {
  try {
    // Loaded lazily so the parsers graph rides with this call rather than with the firebase module itself.
    // Never load website-data as a whole module here: a namespace import bundles every website-data file into the
    // lazy chunks (website-data-barrel.test.js guards it).
    const { getGuildStatCost } = await import('../parsers/guild');
    const startTime = Date.now();

    const snap = collection(firestore, '_guildStat');
    const guildsDocs = await getDocs(fsQuery(snap));

    const allGuilds = [];
    guildsDocs.forEach((doc) => {
      const { stats, n: guildName, i: guildIcon } = doc.data() || {};
      const totalStatCost = getGuildStatCost(stats);
      allGuilds.push({
        id: doc.id,
        totalStatCost,
        guildName,
        guildIcon
      });
    });

    const firstEndTime = Date.now();
    console.info(`Guild firestore execution time: ${firstEndTime - startTime} ms`);

    const sortedGuilds = allGuilds.sort((a, b) => b?.totalStatCost - a?.totalStatCost);
    const topGuilds = sortedGuilds?.slice(0, 150);

    const queries = topGuilds.map(({ id }) => get(query(ref(database, `_guild/${id}`))));
    const results = await Promise.all(queries);

    const guildsWithData = results?.map((doc, index) => {
      const value = doc.val();
      const details = topGuilds?.[index];
      return {
        ...details,
        totalGp: (value?.p || 0) + details?.totalStatCost,
        members: Object.values(value?.m || {})
      };
    });

    const finalResult = guildsWithData
      .sort((a, b) => b?.totalGp - a?.totalGp)
      .filter(({ members }) => members?.length > 10);

    const endTime = Date.now();
    console.info(`Guild realtime db execution time: ${endTime - startTime} ms`);

    callback({ guilds: finalResult });
  } catch (e) {
    console.error('Error fetching guilds:', e);
    callback({ guilds: [], error: true });
  }
};

const getSnapshot = async (dbRef, id, { throwOnError = false } = {}) => {
  try {
    const snapshot = await get(child(dbRef, id));
    if (snapshot?.exists()) {
      return snapshot.val();
    }
    console.error(`No data available for key ${id}`);
    return null;
  } catch (error) {
    console.error(`Error while fetching data for key ${id}:`, error);
    if (throwOnError) throw error;
    return null;
  }
};

const userSignOut = async () => {
  try {
    await signOut(auth);
    console.info('Logged off successfully');
  } catch (error) {
    console.error(`Error while logging out: ${error.code}`, error.message);
    throw error;
  }
};

export {
  signInWithToken,
  signInWithEmailPassword,
  signInWithCustom,
  subscribe,
  checkUserStatus,
  userSignOut
}