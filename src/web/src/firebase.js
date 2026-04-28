import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBbqRcj973kePX3k5eAd7qlQhn-1GG7skQ',
  authDomain: 'project-focus-7722d.firebaseapp.com',
  projectId: 'project-focus-7722d',
  storageBucket: 'project-focus-7722d.firebasestorage.app',
  messagingSenderId: '196219484991',
  appId: '1:196219484991:web:865014eaeb88e06dee318a',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
};
