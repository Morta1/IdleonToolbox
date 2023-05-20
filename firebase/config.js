import { initializeApp, getApps } from 'firebase/app';

const getApp = () => {
  const apps = getApps();
  if (apps?.length > 0) return apps?.[0];
  //2. Initialize app with the config vars
  return initializeApp({
    apiKey: "AIzaSyAU62kOE6xhSrFqoXQPv6_WHxYilmoUxDk",
    authDomain: "idlemmo.firebaseapp.com",
    databaseURL: "idlemmo.firebaseio.com",
    storageBucket: "idlemmo.appspot.com",
    projectId: "idlemmo",
  });
}

//3. export it for use
export default getApp();