// components/Agent.tsx (End Button Fix)
"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CallStatus, SavedMessage } from "@/types/interview";
import { useInterviewData } from "@/hooks/useInterviewData";
import { useVapiCalls } from "@/hooks/useVapiCalls";
import { handleApiSubmission } from "@/lib/services/interview-service";
import { createFeedback } from "@/lib/actions/general.action";
import { cn } from "@/lib/utils";

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
  const { startGenerateWorkflow, startInterviewWorkflow, stopCall } =
    useVapiCalls({
      setCallStatus,
      setIsSpeaking,
      setMessages,
      extractDataFromMessage,
      setError,
      type,
    });

  // Update last message whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
      console.log(`Messages in conversation: ${messages.length}`);
    }
  }, [messages]);

  // Handle feedback generation
  const handleGenerateFeedback = useCallback(async () => {
    console.log("Generating feedback...");
    console.log("Interview ID:", interviewId);
    console.log("User ID:", userId);
    console.log("Messages count:", messages.length);

    if (!interviewId || !userId) {
      console.error("Missing interviewId or userId for feedback generation");
      setError("Missing interview data for feedback generation");
      return false;
    }

    // Check message count here instead of in the disconnect function
    // if (messages.length < 2) {
    //   console.error("Not enough messages for meaningful feedback");
    //   setError(
    //     "The interview was too short to generate meaningful feedback. Please have a longer conversation next time."
    //   );
    //   return false;
    // }

    setIsSubmitting(true);

    try {
      const { success, feedbackId: newFeedbackId } = await createFeedback({
        interviewId,
        userId,
        transcript: messages,
        feedbackId,
      });

      console.log("Feedback creation result:", success, newFeedbackId);

      if (success && newFeedbackId) {
        // Add a delay to ensure the database write is complete
        console.log("Feedback created successfully:", newFeedbackId);
        return true;
      } else {
        console.error("Failed to create feedback");
        setError("Failed to create feedback. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error in feedback creation:", error);
      setError(
        `Error creating feedback: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [interviewId, userId, messages, feedbackId]);

  // Handle interview generation
  const handleInterviewGeneration = useCallback(async () => {
    if (!userId || isSubmitting) return false;

    setIsSubmitting(true);
    try {
      await handleApiSubmission(interviewData, userId);
      return true;
    } catch (error) {
      setError(
        typeof error === "string" ? error : "Failed to create interview"
      );
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [userId, isSubmitting, interviewData]);

  // Process call status changes
  useEffect(() => {
    const processFinishedCall = async () => {
      console.log("Processing finished call. Type:", type);
      console.log("Message count:", messages.length);

      let success = false;

      if (type === "generate") {
        success = await handleInterviewGeneration();
        if (success) {
          // Added delay before redirecting
          setTimeout(() => router.push("/"), 2000);
        }
      }
      // Handle both "practice" and "interview" types
      else if (type === "practice" || type === "interview") {
        success = await handleGenerateFeedback();
        if (success) {
          // Added delay before redirecting
          setTimeout(() => {
            router.push(`/interview/${interviewId}/feedback`);
          }, 2000);
        }
      }

      if (!success) {
        setTimeout(() => router.push("/"), 3000);
      }
    };

    // Process finished calls
    if (callStatus === CallStatus.FINISHED && !isSubmitting) {
      processFinishedCall();
    }
  }, [
    callStatus,
    messages.length,
    type,
    interviewId,
    router,
    isSubmitting,
    handleGenerateFeedback,
    handleInterviewGeneration,
  ]);

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
    // FIXED: End the call immediately without any checks
    console.log("User clicked disconnect. Stopping call immediately...");
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
              alt="ai-interviewer"
              width={120}
              height={120}
              className="object-cover rounded-full"
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
              alt="user"
              width={120}
              height={120}
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

      {isSubmitting && (
        <div className="bg-blue-100 p-4 mt-4 rounded-md text-blue-700">
          Processing interview data... This may take a moment.
        </div>
      )}

      {messages.length > 0 && (
        <div className="transcript-border mt-6">
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

      <div className="w-full flex justify-center mt-6">
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
                  ? "Processing..."
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
