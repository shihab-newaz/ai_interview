// lib/firebase/admin.ts
import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminAuth: Auth;
let adminDb: Firestore;

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin environment variables are not set.");
}

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("Firebase Admin SDK Initialized.");
  } catch (error: any) {
    console.error("Firebase Admin SDK Initialization Error:", error.stack);
  }
} else {
  console.log("Firebase Admin SDK already initialized.");
}


try {
  adminAuth = getAuth();
  adminDb = getFirestore();
} catch (error) {
   console.error("Error getting Firebase Admin Auth/Firestore instances:", error);

}


// Export the admin instances
export { adminAuth, adminDb };