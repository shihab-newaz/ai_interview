// types/interview.ts

export enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
  }
  
  export interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
  }
  
  export interface InterviewData {
    role: string;
    type: string;
    level: string;
    techstack: string;
    amount: number;
  }
  
  export interface AgentProps {
    userName: string;
    userId?: string;
    interviewId?: string;
    feedbackId?: string;
    type: "generate" | "practice";
    questions?: string[];
    profileImage?: string;
  }
  
  export interface VapiMessage {
    type: string;
    transcriptType?: string;
    role?: string;
    transcript?: string;
    input?: string;
    status?: string;
    error?: any;
    errorMsg?: string;
  }