"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

// Assuming adminDb is correctly initialized and exported from here
import { adminDb as db } from "@/firebase/admin"; 
import { feedbackSchema } from "@/constants";

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: Array<{ role: string; content: string }>;
  feedbackId?: string; 
}

interface Interview {
  id: string;
  userId: string;
  role:string;
  type: string;
  techstack: string[];
  createdAt: string; 
  finalized?: boolean;

}

interface Feedback {
  id: string;
  interviewId: string;
  userId: string;
  totalScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  createdAt: string | Date; 
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}


export async function createFeedback(params: CreateFeedbackParams): Promise<{ success: boolean; feedbackId?: string }> {
  const { interviewId, userId, transcript, feedbackId } = params;

  // Validate required parameters
  if (!interviewId || !userId || !transcript) {
      console.error("Missing required parameters for createFeedback");
      return { success: false };
  }

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}\n`
      )
      .join("");

    // --- AI Generation ---
    const { object } = await generateObject({
      model: google("models/gemini-1.5-flash-latest"), // Use appropriate model name
      schema: feedbackSchema, // Ensure this schema matches the expected output structure
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please provide feedback based *only* on the following structure and categories. Score each category from 0 to 100. Calculate the totalScore as the average of the category scores.
        - categoryScores: { communicationSkills: number, technicalKnowledge: number, problemSolving: number, culturalFit: number, confidenceClarity: number }
        - totalScore: number (average of categoryScores)
        - strengths: string[] (list of positive points)
        - areasForImprovement: string[] (list of areas needing work)
        - finalAssessment: string (overall summary and recommendation)
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on a specific structured schema.",
    });


    // --- Data Preparation ---
    // Ensure the AI output matches the expected structure before saving
    const feedbackData = {
      interviewId: interviewId,
      userId: userId,
      totalScore: object.totalScore,
      categoryScores: object.categoryScores,
      strengths: object.strengths,
      areasForImprovement: object.areasForImprovement,
      finalAssessment: object.finalAssessment,
      createdAt: new Date(), 
    };

    // --- Firestore Operation ---
    let feedbackRef;
    if (feedbackId) {
      // Update existing feedback
      feedbackRef = db.collection("feedback").doc(feedbackId);
      await feedbackRef.update(feedbackData); // Use update instead of set if merging
      console.log(`Feedback updated for ID: ${feedbackId}`);
    } else {
      // Create new feedback
      feedbackRef = db.collection("feedback").doc(); // Auto-generate ID
      await feedbackRef.set(feedbackData);
      console.log(`New feedback created with ID: ${feedbackRef.id}`);
    }

    return { success: true, feedbackId: feedbackRef.id };

  } catch (error) {
    console.error("Error in createFeedback:", error);
    return { success: false };
  }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
   // Add validation for ID
   if (!id) {
     console.warn("getInterviewById called with invalid ID.");
     return null;
   }
  try {
      const interviewDoc = await db.collection("interviews").doc(id).get();

      if (!interviewDoc.exists) {
          console.log(`Interview not found for ID: ${id}`);
          return null;
      }

      // Combine document ID with data
      return { id: interviewDoc.id, ...interviewDoc.data() } as Interview;

  } catch (error) {
      console.error(`Error fetching interview by ID ${id}:`, error);
      return null; // Return null on error
  }
}


export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  // Validate parameters
  if (!interviewId || !userId) {
    console.warn("getFeedbackByInterviewId called with invalid parameters.");
    return null;
  }

  try {
      const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId) // Ensure feedback belongs to the correct user
        .orderBy("createdAt", "desc") // Get the latest feedback if multiple exist
        .limit(1)
        .get();

      if (querySnapshot.empty) {
          console.log(`No feedback found for interview ID: ${interviewId} and user ID: ${userId}`);
          return null;
      }

      const feedbackDoc = querySnapshot.docs[0];
      return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;

  } catch (error) {
      console.error(`Error fetching feedback for interview ${interviewId}:`, error);
      return null; // Return null on error
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[]> {
  const { userId, limit = 20 } = params;

   // Validate userId
   if (!userId) {
     console.warn("getLatestInterviews called without a userId to exclude.");
     return [];
   }

  try {
      const interviewsSnapshot = await db
        .collection("interviews")
        .where("finalized", "==", true) // Filter for finalized interviews
        .where("userId", "!=", userId)   // Exclude interviews by the current user
        .orderBy("userId") // Firestore requires ordering by the field used in inequality
        .orderBy("createdAt", "desc") // Then order by creation date
        .limit(limit)
        .get();

      if (interviewsSnapshot.empty) {
          console.log("No other finalized interviews found.");
          return [];
      }

      // Map documents to Interview objects
      return interviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Interview[];

  } catch (error) {
      console.error("Error fetching latest interviews:", error);
      return []; // Return empty array on error
  }
}


export async function getInterviewsByUserId(
  userId: string | undefined | null // Accept potentially undefined/null userId
): Promise<Interview[]> { 

  if (!userId || typeof userId !== 'string') {
    console.warn("getInterviewsByUserId called with invalid or missing userId.");
    return []; 
  }
  

  try {
      const interviewsSnapshot = await db
        .collection("interviews")
        .where("userId", "==", userId) // Now userId is guaranteed to be a string
        .orderBy("createdAt", "desc")
        .get();

      if (interviewsSnapshot.empty) {
          console.log(`No interviews found for user ID: ${userId}`);
          return [];
      }

      // Map documents to Interview objects
      return interviewsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Interview[];

  } catch (error) {
      console.error(`Error fetching interviews for user ${userId}:`, error);
      return []; // Return empty array on error
  }
}
