import { getRandomInterviewCover } from "@/lib/utils";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { adminDb } from "@/firebase/admin";
export async function GET() {
  return Response.json({ success: true, data: "hello" }, { status: 200 });
}

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();
  try {
    const { text: questions } = await generateText({
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
    if (!userid) {
      throw new Error("userid is required");
    }
    const interview = {
      role,
      type,
      level,
      techstack: Array.isArray(techstack) ? techstack : techstack.split(","),
      userId: userid,
      questions: JSON.parse(questions),
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };
    if (!userid) {
      throw new Error("userid is required");
    }
    await adminDb.collection("interviews").add(interview);
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
