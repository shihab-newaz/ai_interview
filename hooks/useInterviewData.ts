// hooks/useInterviewData.ts
import { useRef } from 'react';
import { InterviewData, VapiMessage } from '@/types/interview';

export function useInterviewData() {
  const interviewData = useRef<InterviewData>({
    role: "",
    type: "mixed", // Default
    level: "",
    techstack: "",
    amount: 5, // Default
  });

  const extractDataFromMessage = (message: VapiMessage) => {
    if (!message.transcript) return;
    
    const content = message.transcript;
    const lowerContent = content.toLowerCase();
    
    // Extract role information
    if (content.includes("role") && !interviewData.current.role) {
      if (
        lowerContent.includes("front end") ||
        lowerContent.includes("frontend")
      ) {
        interviewData.current.role = "Frontend Developer";
      } else if (
        lowerContent.includes("back end") ||
        lowerContent.includes("backend")
      ) {
        interviewData.current.role = "Backend Developer";
      } else if (
        lowerContent.includes("full stack") ||
        lowerContent.includes("fullstack")
      ) {
        interviewData.current.role = "Full Stack Developer";
      }
    }

    // Extract experience level
    if (content.includes("level") || content.includes("experience")) {
      if (
        lowerContent.includes("entry level") ||
        lowerContent.includes("junior")
      ) {
        interviewData.current.level = "entry";
      } else if (
        lowerContent.includes("mid") ||
        lowerContent.includes("intermediate")
      ) {
        interviewData.current.level = "mid";
      } else if (
        lowerContent.includes("senior") ||
        lowerContent.includes("expert")
      ) {
        interviewData.current.level = "senior";
      }
    }

    // Extract interview type
    if (
      content.includes("technical") ||
      content.includes("behavioral") ||
      content.includes("mixed")
    ) {
      if (lowerContent.includes("technical")) {
        interviewData.current.type = "technical";
      } else if (lowerContent.includes("behavioral")) {
        interviewData.current.type = "behavioral";
      } else if (lowerContent.includes("mixed")) {
        interviewData.current.type = "mixed";
      }
    }

    // Extract number of questions
    const numberMatch = content.match(/\d+/);
    if (numberMatch && content.includes("question")) {
      interviewData.current.amount = parseInt(numberMatch[0], 10);
    }

    // Extract technologies
    if (content.includes("technologies") || content.includes("tech stack")) {
      // Extract tech stack - look for common technologies
      const techKeywords = [
        "next.js",
        "react",
        "javascript",
        "typescript",
        "node",
        "vue",
        "angular",
        "html",
        "css",
        "tailwind",
        "bootstrap",
        "python",
        "django",
        "ruby",
        "rails",
      ];

      const foundTech = techKeywords.filter((tech) =>
        lowerContent.includes(tech.toLowerCase())
      );
      if (foundTech.length > 0) {
        interviewData.current.techstack = foundTech.join(",");
      }
    }
  };

  return {
    interviewData: interviewData.current,
    extractDataFromMessage,
  };
}