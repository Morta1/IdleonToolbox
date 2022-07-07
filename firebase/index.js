import { getAuth, GoogleAuthProvider, signInWithCredential, signOut, EmailAuthProvider } from 'firebase/auth';
import { child, get, getDatabase, goOnline, ref } from "firebase/database";
import { doc, getDoc, initializeFirestore, onSnapshot } from "firebase/firestore";
import { getApp } from 'firebase/app';
import app from "./config";
import { tryToParse } from "../utility/helpers";

const signInWithToken = async (token) => {
  const auth = getAuth(app);
  const credential = GoogleAuthProvider.credential(token, null);
  const result = await signInWithCredential(auth, credential).catch(function (error) {
    // Handle Errors here.
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      alert('Email already associated with another account.');
      // Handle account linking here, if using.
    } else {
      console.error('Error while trying to sign in with credentials: ', error);
    }
  });

  return result?.user;
};

const signInWithEmailPassword = async ({ email, password } = {}) => {
  const auth = getAuth(app);
  const credential = EmailAuthProvider.credential(email, password);
  const result = await signInWithCredential(auth, credential).catch(function (error) {
    // Handle Errors here.
    const errorCode = error.code;
    if (errorCode === 'auth/account-exists-with-different-credential') {
      alert('Email already associated with another account.');
      // Handle account linking here, if using.
    } else {
      console.error('Error while trying to sign in with credentials: ', error);
    }
  });

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
      console.log("No data available");
    }
  } catch (error) {
    console.log('Error while fetching charNames: ', error);
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
        console.log('Error has occurred on subscribe', err);
      });
  }
}

const userSignOut = async () => {
  const auth = getAuth(app);
  await signOut(auth).then(() => {
    console.log('Logged off successfully');
  }).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(`Error while logging out: ${errorCode}`, errorMessage);
  });
}

export {
  signInWithToken,
  signInWithEmailPassword,
  subscribe,
  checkUserStatus,
  userSignOut
}