// components/Agent.tsx
"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CallStatus } from "@/types/interview";
import { useInterviewData } from "@/hooks/useInterviewData";
import { useVapiCalls } from "@/hooks/useVapiCalls";
import { handleApiSubmission } from "@/lib/services/interview-service";
import { createFeedback } from "@/lib/actions/general.action";
import { cn } from "@/lib/utils";

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  profileImage,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom hooks for interview data and VAPI integration
  const { interviewData, extractDataFromMessage } = useInterviewData();
  const { startGenerateWorkflow, startInterviewWorkflow, stopCall } = useVapiCalls({
    setCallStatus,
    setIsSpeaking,
    setMessages,
    extractDataFromMessage,
    setError,
    type,
  });

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      if (!interviewId || !userId) return;

      const { success, feedbackId: id } = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        setError("Failed to save feedback");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    };

    const handleCallFinished = async () => {
      if (type === "generate") {
        if (!userId || isSubmitting) return;
        
        setIsSubmitting(true);
        try {
          await handleApiSubmission(interviewData, userId);
          setTimeout(() => router.push("/"), 1000);
        } catch (error) {
          setError(typeof error === 'string' ? error : "Failed to create interview");
        } finally {
          setIsSubmitting(false);
        }
      } else if (interviewId) {
        handleGenerateFeedback(messages);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      handleCallFinished();
    }
  }, [callStatus, messages, feedbackId, interviewId, router, type, userId, isSubmitting, interviewData]);

  const handleCall = async () => {
    setError(null);
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      await startGenerateWorkflow(userName, userId);
    } else {
      await startInterviewWorkflow(questions);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    stopCall();
  };

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src={profileImage || "/user-avatar.png"}
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message bg-red-100 p-4 mt-4 rounded-md text-red-700">
          {error}
        </div>
      )}

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => handleCall()}
            disabled={isSubmitting}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== "CONNECTING" && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                ? isSubmitting
                  ? "Saving..."
                  : "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;