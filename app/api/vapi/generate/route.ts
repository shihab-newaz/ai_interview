// app/api/vapi/generate/route.ts
import { NextResponse } from "next/server";
import { getRandomInterviewCover } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { adminDb } from "@/firebase/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Interview API is operational",
  });
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
          
          IMPORTANT: The questions will be READ ALOUD by a voice assistant.
          - DO NOT use any special characters like asterisks (*), slashes (/), underscores (_), etc.
          - DO NOT use formatting marks like bold, italics, or bullet points
          - Write naturally as if you were speaking the questions out loud
          
          Please return ONLY the questions, formatted exactly like this JSON array:
          ["What experience do you have with React?", "Tell me about a challenging project you worked on."]
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
        interviewId: docRef.id,
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
 * Sanitizes questions to remove characters that shouldn't be read by voice assistant
 */
function sanitizeQuestions(questions: string[]): string[] {
  return questions.map((question) => {
    return question
      .replace(/\*/g, "") // Remove asterisks
      .replace(/\//g, " or ") // Replace slashes with "or"
      .replace(/\\/g, "") // Remove backslashes
      .replace(/[#_~`{}[\]|<>^]/g, "") // Remove other special characters
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();
  });
}

function parseQuestions(questionsText: string): string[] {
  try {
    const parsedQuestions = JSON.parse(questionsText);
    if (Array.isArray(parsedQuestions)) {
      return sanitizeQuestions(parsedQuestions);
    }
    throw new Error("Questions are not in array format");
  } catch (parseError) {
    // Try to extract anything between square brackets
    try {
      const matches = questionsText.match(/\[(.*)\]/s);
      if (matches && matches[1]) {
        const cleanedQuestions = `[${matches[1]}]`;
        return sanitizeQuestions(JSON.parse(cleanedQuestions));
      }

      // If no brackets found, try to split by line breaks
      const lines = questionsText
        .split(/\r?\n/)
        .filter(
          (line) =>
            line.trim() && line.trim().startsWith('"') && line.includes('"')
        )
        .map((line) => line.trim());

      if (lines.length > 0) {
        return sanitizeQuestions(lines);
      }

      return sanitizeQuestions([questionsText.trim()]);
    } catch (recoveryError) {
      return sanitizeQuestions([questionsText.trim()]);
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

  if (typeof techstack === "string") {
    return techstack.split(",").map((t) => t.trim());
  }

  return ["JavaScript", "React"];
}
