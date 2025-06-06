// lib/actions/auth.action.ts
"use server";

import { adminDb as db, adminAuth as auth, adminDb } from "@/firebase/admin";
import { cookies } from "next/headers";

const EXPIRATION_TIME = 60 * 60 * 24 * 7 * 1000; // 7 days in milliseconds

export async function signUp(
  params: SignUpParams
): Promise<{ success: boolean; message: string }> {
  const { uid, name, email } = params;

  // Validate required parameters
  if (!uid || !name || !email) {
    console.error("signUp: Missing required parameters.");
    return { success: false, message: "Missing user information." };
  }

  try {
    // Check if user already exists in Firestore (optional but good practice)
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      console.warn(`signUp: User document already exists for UID: ${uid}`);
      // Decide if this is an error or just needs linking
      return {
        success: false,
        message: "User record already exists. Please sign in.",
      };
    }

    // Create user document in Firestore
    await userRef.set({
      name,
      email,
      createdAt: new Date(),
    });

    console.log(`signUp: User record created successfully for UID: ${uid}`);
    return { success: true, message: "Account created successfully" };
  } catch (e: any) {
    console.error(`signUp: Error creating user record for UID ${uid}:`, e);

    return { success: false, message: "Error setting up user account." };
  }
}

export async function setSessionCookie(idToken: string): Promise<void> {
  console.log("Attempting to set session cookie...");
  try {
    const cookieStore = await cookies();

    // Verify ID token and create session cookie
    const decodedIdToken = await auth.verifyIdToken(idToken); // Verify token first (optional but recommended)
    console.log(`Verified ID token for UID: ${decodedIdToken.uid}`);

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: EXPIRATION_TIME,
    });

    // Set the cookie
    cookieStore.set("session", sessionCookie, {
      maxAge: EXPIRATION_TIME / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });
    console.log("Session cookie set successfully.");
  } catch (error) {
    console.error("Error in setSessionCookie:", error);
    // Re-throw the error so the calling function knows something went wrong
    throw new Error("Failed to set session cookie.");
  }
}

export async function signIn(
  params: SignInParams
): Promise<{ success: boolean; message?: string }> {
  const { email, idToken } = params; // Email might not be strictly needed if idToken is verified

  // Validate parameters
  if (!idToken) {
    console.error("signIn: Missing idToken.");
    return { success: false, message: "Authentication token missing." };
  }
  // Optional: Validate email if you use it for lookup
  if (!email) {
    console.error("signIn: Missing email.");
    return { success: false, message: "Email missing." };
  }

  try {
    // Set the session cookie (this also implicitly verifies the idToken)
    await setSessionCookie(idToken);

    return { success: true };
  } catch (e: any) {
    console.error(
      `signIn: Error during sign-in process for email ${email}:`,
      e
    );
    // Check for specific errors if needed, e.g., from verifyIdToken or getUserByEmail
    if (e.code === "auth/user-not-found") {
      return { success: false, message: "User account not found." };
    }
    if (e.message === "Failed to set session cookie.") {
      return { success: false, message: "Could not create session." };
    }
    // Generic error for other cases
    return { success: false, message: "An error occurred during sign in." };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) {
    return null; //No session cookie found
  }
  try {
    const decodedClaims = await auth.verifySessionCookie(
      sessionCookie,
      true // Check revocation status
    );

    // Get user data from Firestore using the UID from the verified cookie
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) {
      console.warn(
        `getCurrentUser: Firestore user document not found for UID: ${decodedClaims.uid}`
      );

      return null;
    }

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error: any) {
    if (error.code === "auth/session-cookie-expired") {
      console.log("getCurrentUser: Session cookie expired.");
    } else if (error.code === "auth/session-cookie-revoked") {
      console.log("getCurrentUser: Session cookie revoked.");
    } else {
      console.error(
        "getCurrentUser: Error verifying session cookie or fetching user:",
        error
      );
    }
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user; //if user='', return false
}

// export async function getInterviewByUserId(userId: string) {
//   const interviews = await adminDb
//     .collection("interviews")
//     .where("userId", "==", userId)
//     .orderBy("createdAt", "desc")
//     .get();
//   return interviews.docs.map((doc) => ({
//     id: doc.id,
//     ...doc.data(),
//   })) as Interview[];
// }
