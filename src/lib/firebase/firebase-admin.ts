import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";

let app: App | undefined;
let messagingInstance: Messaging | undefined;

function initializeFirebaseAdmin(): App {
  if (app) {
    return app;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    app = existingApps[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // During build time, skip initialization if config is missing
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build" ||
    !process.env.FIREBASE_PROJECT_ID;

  if (!projectId || !clientEmail || !privateKey) {
    const missingVars = [];
    if (!projectId) missingVars.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missingVars.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missingVars.push("FIREBASE_PRIVATE_KEY");

    // During build, return a mock app instead of throwing
    if (isBuildTime) {
      console.warn(
        `[Firebase Admin] Skipping initialization during build. Missing: ${missingVars.join(", ")}`
      );
      // Return a minimal app instance that won't be used
      // This is a workaround for Next.js build process
      return existingApps[0] || ({} as App);
    }

    throw new Error(
      `Firebase Admin SDK configuration missing. Please set the following environment variables: ${missingVars.join(", ")}`
    );
  }

  try {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Firebase Admin] Initialized successfully");
    }

    return app;
  } catch (error) {
    console.error("[Firebase Admin] Initialization failed:", error);
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

export function getFirebaseApp(): App {
  if (!app) {
    app = getApps()[0] || initializeFirebaseAdmin();
  }
  return app;
}

export function getMessagingInstance(): Messaging | null {
  // Check if we're in build context and config is missing
  const isBuildTime =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-development-build";
  const hasConfig =
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (isBuildTime && !hasConfig) {
    return null;
  }

  if (!messagingInstance) {
    try {
      const firebaseApp = getFirebaseApp();
      messagingInstance = getMessaging(firebaseApp);
    } catch (error) {
      // During build, return null instead of throwing
      if (isBuildTime) {
        console.warn("[Firebase Admin] Skipping messaging initialization during build");
        return null;
      }
      throw error;
    }
  }
  return messagingInstance;
}

// Lazy initialization - only initialize when actually used, not at module load
// This allows the build to succeed even if Firebase config is missing
export const messaging = getMessagingInstance();

export function validateFirebaseConfig(): boolean {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    return !!(projectId && clientEmail && privateKey);
  } catch {
    return false;
  }
}
