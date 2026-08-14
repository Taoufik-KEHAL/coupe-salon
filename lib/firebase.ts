import AsyncStorage from '@react-native-async-storage/async-storage';
// getReactNativePersistence resolves fine at runtime via Metro's "react-native"
// export condition, but @firebase/auth's exports map lists a flat "types" entry
// ahead of the react-native branch, so TS always resolves the non-RN .d.ts here.
// See firebase-js-sdk issues about getReactNativePersistence + TS exports resolution.
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Skip initialization entirely when unconfigured: initializeAuth talks to
// the Firebase Auth backend as soon as it runs and throws auth/invalid-api-key
// with an empty config, which would crash the app even in mock mode (see
// lib/mockBackend.ts), where auth/db are never actually called.
const isConfigured = !!firebaseConfig.apiKey;

let _app: ReturnType<typeof initializeApp> | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;

if (isConfigured) {
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    _auth = initializeAuth(_app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // initializeAuth throws if it was already called for this app (e.g. Fast Refresh) — reuse it.
    _auth = getAuth(_app);
  }
  _db = getFirestore(_app);
}

// auth/db are only ever dereferenced on the non-mock code paths (guarded by
// isMockMode in the hooks), where isConfigured is guaranteed true — asserted
// non-null here so those call sites don't need casts.
const app = _app;
const auth = _auth as Auth;
const db = _db as Firestore;

export { app, auth, db };
