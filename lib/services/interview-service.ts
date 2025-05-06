// lib/interview-api.ts
import { InterviewData } from '@/types/interview';

/**
 * Submits interview data to the API
 * @param interviewData The interview data collected from the conversation
 * @param userId The user ID
 * @returns Promise that resolves when the API call is complete
 */
export async function handleApiSubmission(
  interviewData: InterviewData,
  userId: string
): Promise<boolean> {
  try {
    const response = await fetch('/api/vapi/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...interviewData,
        userid: userId,
      }),
    });

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || "Unknown error");
    }
    
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Failed to create interview";
      
    throw new Error(errorMessage);
  }
}