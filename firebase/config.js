import { initializeApp } from 'firebase/app';

//2. Initialize app with the config vars
const app = initializeApp({
  apiKey: "AIzaSyAU62kOE6xhSrFqoXQPv6_WHxYilmoUxDk",
  authDomain: "idlemmo.firebaseapp.com",
  databaseURL: "idlemmo.firebaseio.com",
  projectId: "idlemmo",
});

//3. export it for use
export default app;