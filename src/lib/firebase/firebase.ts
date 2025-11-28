import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined;
let messaging: Messaging | undefined;

if (typeof window !== "undefined") {
  const existingApps = getApps();
  app =
    existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);

  if ("serviceWorker" in navigator) {
    try {
      messaging = getMessaging(app);
    } catch (error) {
      console.warn("[Firebase] Messaging initialization failed:", error);
    }
  }
}

export { app, messaging, getToken, onMessage };
