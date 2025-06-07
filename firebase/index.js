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
  initializeFirestore,
  onSnapshot,
  query as fsQuery
} from 'firebase/firestore';
import { getApp } from 'firebase/app';
import app from './config';
import { tryToParse } from '../utility/helpers';
import { guildBonuses } from '../data/website-data';
import { calculateGuildBonusCost } from '../parsers/guild';

const signInWithToken = async (token, type) => {
  const auth = getAuth(app);
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
  const result = await signInWithCredential(auth, credential).catch(function (error) {
    // Handle Errors here.
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Email already associated with another account.');
      // Handle account linking here, if using.
    } else {
      console.error('Error while trying to sign in with credentials: ', error);
      throw new Error(error)
    }
  });

  return result?.user;
};

const signInWithEmailPassword = async ({ email, password } = {}) => {
  const auth = getAuth(app);
  const result = await signInWithEmailAndPassword(auth, email, password).catch(function (error) {
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Email already associated with another account.')
    } else if (errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-password' || errorCode === 'auth/wrong-password') {
      throw new Error('Username or password is incorrect')
    } else {
      console.error('Error while trying to sign in with credentials: ', error);
      throw new Error(error)
    }
  });

  return result?.user;
}

const signInWithCustom = async (token, dispatch) => {
  if (!token) return;
  const auth = getAuth(app);
  const result = await signInWithCustomToken(auth, token).catch(function (error) {
    dispatch({ type: 'loginError', data: error?.message })
  })
  return result?.user;
}

const checkUserStatus = () => {
  const auth = getAuth(app);
  return new Promise((resolve, reject) => {
    try {
      auth.onAuthStateChanged(user => {
        if (user) {
          resolve(user)
        } else {
          resolve(null)
        }
      })
    } catch (err) {
      reject(err)
    }
  });
}

const subscribe = async (uid, accessToken, callback) => {
  const app = getApp();
  const database = getDatabase(app);
  const firestore = initializeFirestore(app, {});
  goOnline(database);
  const dbRef = ref(database);
  const charNames = await getSnapshot(dbRef, `_uid/${uid}`);
  if (!charNames) {
    throw new Error('No characters found');
  }

  let serverVars;
  if (firestore?.type === 'firestore') {
    const res = await getDoc(doc(firestore, '_vars', '_vars'));
    if (res.exists()) {
      serverVars = res.data();
    }
  }
  if (charNames?.length > 0) {
    const docSnapshot = await getDoc(doc(firestore, '_data', uid));
    let createTime;
    if (docSnapshot.exists()) {
      createTime = docSnapshot._document.createTime.toTimestamp();
    }
    return onSnapshot(doc(firestore, '_data', uid),
      { includeMetadataChanges: true }, async (doc) => {
        if (doc.exists()) {
          const companion = await getSnapshot(dbRef, `_comp/${uid}`);
          // const friendsList = await getSnapshot(dbRef, `_friends/_list/${uid}`); // friend list
          // const serverLogs = await getSnapshot(dbRef, `_dm/${uid}/_msg`);
          // const lt = await getSnapshot(dbRef, `_dm/${uid}/_lt`); // not sure
          // const lastGuildChatMsgTimestamp = await getSnapshot(dbRef, `_usgu/${uid}/t`);
          const guildId = await getSnapshot(dbRef, `_usgu/${uid}/g`);
          const guild = await getSnapshot(dbRef, `_guild/${guildId}`);
          const cloudsave = doc.data();
          callback(cloudsave, charNames, companion, {
            stats: tryToParse(cloudsave?.Guild),
            members: Object.values(guild?.m || {}),
            points: guild?.p
          }, serverVars, createTime, uid, accessToken);
        }
      }, (err) => {
        console.error('Error has occurred on subscribe', err);
      });
  }
}

export const getGuilds = async (callback) => {
  try {
    const startTime = Date.now();
    const app = getApp();
    const database = getDatabase(app);
    const firestore = initializeFirestore(app, {});
    const snap = collection(firestore, '_guildStat');
    const guildsDocs = await getDocs(fsQuery(snap));
    const allGuilds = [];
    guildsDocs.forEach((doc) => {
      const { stats, n: guildName, i: guildIcon } = doc.data() || {};
      const totalStatCost = stats?.reduce((sum, targetLevel, index) => sum + calculateGuildBonusCost(targetLevel,
        guildBonuses?.[index]?.gpBaseCost, guildBonuses?.[index]?.gpIncrease), 0);
      allGuilds.push({
        id: doc.id,
        totalStatCost,
        guildName,
        guildIcon
      });
    })
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
      }
    });
    const finalResult = guildsWithData.sort((a, b) => b?.totalGp - a?.totalGp)?.filter(({ members }) => members?.length > 10);
    const endTime = Date.now();
    console.info(`Guild realtime db execution time: ${endTime - startTime} ms`);
    callback({ guilds: finalResult });
  } catch (e) {
    console.error(e);
    callback({ guilds: [], error: true })
  }
}

const getSnapshot = async (dbRef, id) => {
  try {
    const snapshot = await get(child(dbRef, id))
    if (snapshot && snapshot.exists()) {
      return snapshot.val();
    } else {
      console.error(`No data available for key ${id}`);
      return null;
    }
  } catch (error) {
    console.error(`Error while fetching data for key ${id}: `, error);
    return null;
  }
}

const userSignOut = async () => {
  const auth = getAuth(app);
  await signOut(auth).then(() => {
    console.info('Logged off successfully');
  }).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error(`Error while logging out: ${errorCode}`, errorMessage);
  });
}

export {
  signInWithToken,
  signInWithEmailPassword,
  signInWithCustom,
  subscribe,
  checkUserStatus,
  userSignOut
}