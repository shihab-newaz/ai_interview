// app/api/vapi/generate/route.ts
import { NextResponse } from 'next/server';
import { getRandomInterviewCover } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { adminDb } from "@/firebase/admin";
import { logger } from '@/lib/logger';

export async function GET() {
  return NextResponse.json({ success: true, message: "Interview API is operational" });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, role, level, techstack, amount, userid } = body;
    
    // Validate required fields
    if (!userid) {
      return NextResponse.json(
        { success: false, error: "userid is required" }, 
        { status: 400 }
      );
    }
    
    try {
      // Generate interview questions
      const { text: questionsText } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `Prepare questions for a job interview
                The job role is ${role}
                The job level is ${level}
                The tech stack used in the job is ${techstack}
                The amount of questions is ${amount}
                The focus between behavioural and technical questions should lean towards ${type}
                Please return only the questions without any additional text.
                The questions are going to be read by a voice assistant so do not use "/" or '*' or any other punctuation marks.
                Return the questions formatted like this:
                ["Question 1", "Question 2", "Question 3"]
        `,
      });
      
      // Parse questions, with error handling
      const parsedQuestions = parseQuestions(questionsText);
      
      // Format techstack properly
      const formattedTechstack = formatTechstack(techstack);
      
      // Create interview object
      const interview = {
        role: role || "Frontend Developer",
        type: type || "mixed",
        level: level || "entry",
        techstack: formattedTechstack,
        userId: userid,
        questions: parsedQuestions,
        finalized: true,
        coverImage: getRandomInterviewCover(),
        createdAt: new Date().toISOString(),
      };
      
      // Add to Firestore
      const docRef = await adminDb.collection("interviews").add(interview);
      
      return NextResponse.json({ 
        success: true, 
        interviewId: docRef.id 
      });
    } catch (error) {
      logger.error("Interview generation error", error);
      return NextResponse.json(
        { success: false, error: `Error generating interview: ${error}` },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Unexpected API error", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Parses questions from the model response
 */
function parseQuestions(questionsText: string): string[] {
  try {
    const parsedQuestions = JSON.parse(questionsText);
    if (Array.isArray(parsedQuestions)) {
      return parsedQuestions;
    }
    throw new Error("Questions are not in array format");
  } catch (parseError) {
    // Try to extract anything between square brackets
    try {
      const matches = questionsText.match(/\[(.*)\]/s);
      if (matches && matches[1]) {
        const cleanedQuestions = `[${matches[1]}]`;
        return JSON.parse(cleanedQuestions);
      }
      
      // If no brackets found, try to split by line breaks
      const lines = questionsText.split(/\r?\n/)
        .filter(line => line.trim() && line.trim().startsWith('"') && line.includes('"'))
        .map(line => line.trim());
        
      if (lines.length > 0) {
        return lines;
      }
      
      // Last resort - return as a single question
      return [questionsText.trim()];
    } catch (recoveryError) {
      // Default to a simple array with the raw response
      return [questionsText.trim()];
    }
  }
}

/**
 * Formats the techstack properly
 */
function formatTechstack(techstack: string | string[] | undefined): string[] {
  if (Array.isArray(techstack)) {
    return techstack;
  }
  
  if (typeof techstack === 'string') {
    return techstack.split(",").map(t => t.trim());
  }
  
  return ["JavaScript", "React"];
}