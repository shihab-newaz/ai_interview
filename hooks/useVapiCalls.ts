// hooks/useVapiCalls.ts
import { useEffect } from 'react';
import { vapi } from '@/lib/vapi.sdk';
import { interviewer } from '@/constants';
import { CallStatus, SavedMessage, VapiMessage } from '@/types/interview';

interface VapiHookProps {
  setCallStatus: (status: CallStatus) => void;
  setIsSpeaking: (speaking: boolean) => void;
  setMessages: (callback: (prev: SavedMessage[]) => SavedMessage[]) => void;
  extractDataFromMessage: (message: VapiMessage) => void;
  setError: (error: string | null) => void;
  type: string;
}

export function useVapiCalls({
  setCallStatus,
  setIsSpeaking,
  setMessages,
  extractDataFromMessage,
  setError,
  type,
}: VapiHookProps) {
  
  // Handle VAPI errors properly
  const handleVapiError = (error: any) => {
    console.log("VAPI error received:", error);
    
    // Check if this is just a normal call ending (not a real error)
    if (
      error?.errorMsg === "Meeting has ended" ||
      error?.error?.errorMsg === "Meeting has ended" ||
      (typeof error === 'string' && error.includes("Meeting has ended")) ||
      (error?.message && error.message.includes("Meeting has ended"))
    ) {
      // This is expected behavior - the call is ending normally
      console.log("Call ended normally. Not an error.");
      setCallStatus(CallStatus.FINISHED);
      return;
    }
    
    // For actual errors, set error state and log details
    console.error("VAPI error details:", error);
    setError(
      typeof error === "string"
        ? error
        : error?.errorMsg ||
            error?.message ||
            "An error occurred with the interview service"
    );
    
    // If error happens during a call, also set call status to INACTIVE
    setCallStatus(CallStatus.INACTIVE);
  };

  useEffect(() => {
    const onCallStart = () => {
      console.log("Call started");
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      console.log("Call ended normally");
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: VapiMessage) => {
      // Log the complete message object to see all available data
      console.log("Raw VAPI message received:", JSON.stringify(message, null, 2));
      
      if (message.type === "transcript" && message.transcriptType === "final") {
        console.log("Processing transcript message:", {
          type: message.type,
          transcriptType: message.transcriptType,
          role: message.role,
          content: message.transcript
        });
        
        const newMessage = { 
          role: message.role as "user" | "system" | "assistant", 
          content: message.transcript as string 
        };
        
        // Log before state update
        console.log("Adding new message to state:", newMessage);
        
        setMessages((prev) => {
          const updated = [...prev, newMessage];
          console.log("Messages state after update:", updated);
          return updated;
        });
    
        // Extract interview data from conversation
        if (type === "generate") {
          extractDataFromMessage(message);
        }
      } else {
        console.log("Skipped message - not a final transcript:", {
          type: message.type,
          transcriptType: message.transcriptType 
        });
      }
    };

    const onSpeechStart = () => {
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      handleVapiError(error);
    };

    // vapi event listeners
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);
    console.log("VAPI event listeners registered successfully");

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [setCallStatus, setIsSpeaking, setMessages, extractDataFromMessage, setError, type]);


  useEffect(() => {
    // Check if VAPI is properly initialized
    if (!vapi) {
      console.error("VAPI SDK is not properly initialized!");
      setError("Interview service is not available. Please refresh the page and try again.");
    } else {
      console.log("VAPI SDK is initialized correctly");
    }
  }, [setError]);

  const startGenerateWorkflow = async (userName: string, userId?: string) => {
    try {
      console.log("Starting generate workflow with:", { userName, userId });
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
        clientMessages: [],
        serverMessages: [],
      });
    } catch (error) {
      console.error("Error starting generate workflow:", error);
      handleVapiError(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const startInterviewWorkflow = async (questions?: string[]) => {
    try {
      console.log("Starting interview workflow with questions:", questions?.length);
      let formattedQuestions = "";
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
        clientMessages: [],
        serverMessages: [],
      });
    } catch (error) {
      console.error("Error starting interview workflow:", error);
      handleVapiError(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const stopCall = () => {
    console.log("Stopping call...");
    try {
      vapi.stop();
      console.log("Call stop command sent successfully");
    } catch (error) {
      console.error("Error stopping call:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      // Still set call as finished even if there's an error stopping
      setCallStatus(CallStatus.FINISHED);
    }
  };

  return {
    startGenerateWorkflow,
    startInterviewWorkflow,
    stopCall,
  };
}