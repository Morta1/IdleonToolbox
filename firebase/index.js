import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  OAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { child, get, getDatabase, goOnline, ref } from "firebase/database";
import { doc, getDoc, initializeFirestore, onSnapshot } from "firebase/firestore";
import { getApp } from 'firebase/app';
import app from "./config";
import { tryToParse } from "../utility/helpers";

const signInWithToken = async (token, type) => {
  const auth = getAuth(app);
  let credential;
  if (type === 'apple') {
    const provider = new OAuthProvider('apple.com');
    credential = provider.credential({
      idToken: token?.id_token,
      rawNonce: token?.nonce,
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
    // Handle Errors here.
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      throw new Error('Email already associated with another account.')
      // Handle account linking here, if using.
    } else {
      console.error('Error while trying to sign in with credentials: ', error);
      throw new Error(error)
    }
  });

  return result?.user;
}

const signInWithApple = async () => {
  const auth = getAuth(app);
  const provider = new OAuthProvider('apple.com');
  const result = await signInWithPopup(auth, provider);
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

const subscribe = async (uid, callback) => {
  const app = getApp();
  const database = getDatabase(app);
  const firestore = initializeFirestore(app, {});
  goOnline(database);
  const dbRef = ref(database);
  let charNames;
  try {
    const charSnapshot = await get(child(dbRef, `_uid/${uid}`))
    if (charSnapshot && charSnapshot.exists()) {
      charNames = charSnapshot.val();
    } else {
      console.error("No data available");
    }
  } catch (error) {
    console.error('Error while fetching charNames: ', error);
  }
  let serverVars;
  if (firestore?.type === "firestore") {
    const res = await getDoc(doc(firestore, "_vars", "_vars"));
    if (res.exists()) {
      serverVars = res.data();
    }
  }
  if (charNames?.length > 0) {
    return onSnapshot(doc(firestore, "_data", uid),
      { includeMetadataChanges: true }, (doc) => {
        if (doc.exists()) {
          const cloudsave = doc.data();
          callback(cloudsave, charNames, { stats: tryToParse(cloudsave?.Guild) }, serverVars);
        }
      }, (err) => {
        console.error('Error has occurred on subscribe', err);
      });
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
  signInWithApple,
  subscribe,
  checkUserStatus,
  userSignOut
}