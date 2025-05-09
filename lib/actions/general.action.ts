//lib/actions/general.action.ts
"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { adminDb as db } from "@/firebase/admin"; 

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

    console.log("Generating feedback with transcript length:", formattedTranscript.length);
    console.log("Number of messages in transcript:", transcript.length);

    // --- AI Generation using text completion instead of structured output ---
    console.log("Calling Gemini API for text-based feedback generation...");
    
    // Import generateText if not already imported
    const { generateText } = await import('ai');
    
    const { text } = await generateText({
      model: google("models/gemini-1.5-flash-latest"),
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        
        Transcript:
        ${formattedTranscript}

        Please provide feedback in JSON format with the following structure:
        {
          "totalScore": 75, // Average of all category scores
          "categoryScores": [
            {
              "name": "Communication Skills",
              "score": 80,
              "comment": "The candidate communicated clearly and effectively."
            },
            {
              "name": "Technical Knowledge",
              "score": 75,
              "comment": "The candidate showed good understanding of key concepts."
            },
            {
              "name": "Problem Solving",
              "score": 70,
              "comment": "The candidate approached problems methodically."
            },
            {
              "name": "Cultural Fit",
              "score": 85,
              "comment": "The candidate demonstrated values aligned with the company."
            },
            {
              "name": "Confidence and Clarity",
              "score": 75,
              "comment": "The candidate was reasonably confident in their responses."
            }
          ],
          "strengths": [
            "Strong communication skills",
            "Good technical knowledge",
            "Positive attitude"
          ],
          "areasForImprovement": [
            "Could provide more specific examples",
            "Should work on more advanced concepts"
          ],
          "finalAssessment": "The candidate performed well overall and would be a good fit for the role."
        }

        If the transcript is very short or incomplete, still provide a fair assessment based on what's available, noting that the evaluation is limited by the brevity of the interview.

        Respond ONLY with the JSON object - no additional text.
      `,
      system: "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on a specific structured schema.",
    });

    console.log("Raw text response received from AI");

    // Define interfaces to handle TypeScript typing
    interface CategoryScore {
      name: string;
      score: number;
      comment: string;
    }

    interface FeedbackObject {
      totalScore: number;
      categoryScores: CategoryScore[];
      strengths: string[];
      areasForImprovement: string[];
      finalAssessment: string;
    }

    // Parse the JSON response and handle potential errors
    let parsedFeedback: FeedbackObject;
    
    try {
      // Clean the response text in case it contains any non-JSON content
      const jsonText = text.trim().replace(/```json|```/g, '');
      parsedFeedback = JSON.parse(jsonText);
      
      console.log("Successfully parsed feedback JSON");
      
      // Validate the parsed object has the expected structure
      if (typeof parsedFeedback.totalScore !== 'number') {
        throw new Error("Missing or invalid totalScore in feedback");
      }
      
      if (!Array.isArray(parsedFeedback.categoryScores)) {
        throw new Error("Missing or invalid categoryScores array in feedback");
      }
      
      if (!Array.isArray(parsedFeedback.strengths)) {
        parsedFeedback.strengths = ["Evaluation limited due to brief interview"];
      }
      
      if (!Array.isArray(parsedFeedback.areasForImprovement)) {
        parsedFeedback.areasForImprovement = ["Need more conversation to provide detailed areas for improvement"];
      }
      
      if (typeof parsedFeedback.finalAssessment !== 'string' || !parsedFeedback.finalAssessment) {
        parsedFeedback.finalAssessment = "Assessment limited due to brief interview content.";
      }
      
    } catch (parseError) {
      console.error("Error parsing feedback JSON:", parseError);
      console.error("Raw response text:", text);
      
      // Create a fallback feedback object
      parsedFeedback = {
        totalScore: 50,
        categoryScores: [
          {
            name: "Communication Skills",
            score: 50,
            comment: "Limited assessment due to brief interview"
          },
          {
            name: "Technical Knowledge",
            score: 50,
            comment: "Limited assessment due to brief interview"
          },
          {
            name: "Problem Solving",
            score: 50,
            comment: "Limited assessment due to brief interview"
          },
          {
            name: "Cultural Fit",
            score: 50,
            comment: "Limited assessment due to brief interview"
          },
          {
            name: "Confidence and Clarity",
            score: 50,
            comment: "Limited assessment due to brief interview"
          }
        ],
        strengths: ["Unable to assess from limited conversation"],
        areasForImprovement: ["Need more substantial interview to evaluate"],
        finalAssessment: "Unable to provide a complete assessment due to limited interview data. Consider conducting a more extensive interview."
      };
    }

    // --- Data Preparation ---
    const feedbackData = {
      interviewId: interviewId,
      userId: userId,
      totalScore: parsedFeedback.totalScore,
      categoryScores: parsedFeedback.categoryScores,
      strengths: parsedFeedback.strengths,
      areasForImprovement: parsedFeedback.areasForImprovement,
      finalAssessment: parsedFeedback.finalAssessment,
      createdAt: new Date(),
    };

    console.log("Prepared feedback data for storage, total score:", feedbackData.totalScore);

    // --- Firestore Operation ---
    let feedbackRef;
    if (feedbackId) {
      // Update existing feedback
      feedbackRef = db.collection("feedback").doc(feedbackId);
      await feedbackRef.update(feedbackData);
      console.log(`Feedback updated for ID: ${feedbackId}`);
    } else {
      // Create new feedback
      feedbackRef = db.collection("feedback").doc();
      await feedbackRef.set(feedbackData);
      console.log(`New feedback created with ID: ${feedbackRef.id}`);
    }

    return { success: true, feedbackId: feedbackRef.id };

  } catch (error) {
    console.error("Error in createFeedback:", error);
    
    // Add additional error information if available
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if ('cause' in error) {
        console.error("Error cause:", (error as any).cause);
      }
    }
    
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
