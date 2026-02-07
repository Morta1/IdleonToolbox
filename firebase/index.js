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
import { guildBonuses } from '@website-data';
import { calculateGuildBonusCost } from '../parsers/guild';

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
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Email already associated with another account.');
    }
    console.error('Error while trying to sign in with credentials:', error);
    throw error;
  }
};

const signInWithEmailPassword = async ({ email, password } = {}) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result?.user;
  } catch (error) {
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Email already associated with another account.');
    } else if (
      errorCode === 'auth/invalid-email' || 
      errorCode === 'auth/user-not-found' || 
      errorCode === 'auth/invalid-password' || 
      errorCode === 'auth/wrong-password'
    ) {
      throw new Error('Username or password is incorrect');
    }
    console.error('Error while trying to sign in with credentials:', error);
    throw error;
  }
};

const signInWithCustom = async (token, dispatch) => {
  if (!token) return;
  
  try {
    const result = await signInWithCustomToken(auth, token);
    return result?.user;
  } catch (error) {
    dispatch({ type: 'loginError', data: error?.message });
    throw error;
  }
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
  
  const charNames = await getSnapshot(dbRef, `_uid/${uid}`);
  if (!charNames) {
    throw new Error('No characters found for this account');
  }

  let serverVars;
  const serverVarsDoc = await getDoc(doc(firestore, '_vars', '_vars'));
  if (serverVarsDoc.exists()) {
    serverVars = serverVarsDoc.data();
  }

  if (charNames?.length === 0) {
    throw new Error('No characters found for this account');
  }

  const docSnapshot = await getDoc(doc(firestore, '_data', uid));
  let createTime;
  if (docSnapshot.exists()) {
    createTime = docSnapshot._document.createTime.toTimestamp();
  }

  return onSnapshot(
    doc(firestore, '_data', uid),
    { includeMetadataChanges: true }, 
    async (doc) => {
      if (!doc.exists()) return;

      const [companion, guildId] = await Promise.all([
        getSnapshot(dbRef, `_comp/${uid}`),
        getSnapshot(dbRef, `_usgu/${uid}/g`)
      ]);

      const guild = guildId ? await getSnapshot(dbRef, `_guild/${guildId}`) : null;

      const cloudsave = doc.data();
      const guildData = {
        stats: tryToParse(cloudsave?.Guild),
        members: Object.values(guild?.m || {}),
        points: guild?.p
      };

      callback(
        cloudsave, 
        charNames, 
        companion, 
        guildData, 
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

export const getGuilds = async (callback) => {
  try {
    const startTime = Date.now();
    
    const snap = collection(firestore, '_guildStat');
    const guildsDocs = await getDocs(fsQuery(snap));
    
    const allGuilds = [];
    guildsDocs.forEach((doc) => {
      const { stats, n: guildName, i: guildIcon } = doc.data() || {};
      const totalStatCost = stats?.reduce(
        (sum, targetLevel, index) => sum + calculateGuildBonusCost(
          targetLevel,
          guildBonuses?.[index]?.gpBaseCost, 
          guildBonuses?.[index]?.gpIncrease
        ), 
        0
      );
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

const getSnapshot = async (dbRef, id) => {
  try {
    const snapshot = await get(child(dbRef, id));
    if (snapshot?.exists()) {
      return snapshot.val();
    }
    console.error(`No data available for key ${id}`);
    return null;
  } catch (error) {
    console.error(`Error while fetching data for key ${id}:`, error);
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