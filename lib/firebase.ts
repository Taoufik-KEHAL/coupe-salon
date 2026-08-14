import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence resolves fine at runtime via Metro's "react-native"
// export condition, but @firebase/auth's exports map lists a flat "types" entry
// ahead of the react-native branch, so TS always resolves the non-RN .d.ts here.
// See firebase-js-sdk issues about getReactNativePersistence + TS exports resolution.
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if it was already called for this app (e.g. Fast Refresh) — reuse it.
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };
