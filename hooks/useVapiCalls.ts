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
    // Check if this is just a normal call ending
    if (
      error?.errorMsg === "Meeting has ended" ||
      error?.error?.errorMsg === "Meeting has ended"
    ) {
      // This is expected behavior - the call is ending
      setCallStatus(CallStatus.FINISHED);
      return;
    }
    
    // For other errors, set error state
    setError(
      typeof error === "string"
        ? error
        : error?.errorMsg ||
            error?.message ||
            "An error occurred with the interview service"
    );
  };

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { 
          role: message.role as "user" | "system" | "assistant", 
          content: message.transcript as string 
        };
        setMessages((prev) => [...prev, newMessage]);

        // Extract interview data from conversation
        if (type === "generate") {
          extractDataFromMessage(message);
        }
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

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, [setCallStatus, setIsSpeaking, setMessages, extractDataFromMessage, setError, type]);

  const startGenerateWorkflow = async (userName: string, userId?: string) => {
    try {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!, {
        variableValues: {
          username: userName,
          userid: userId,
        },
        clientMessages: [],
        serverMessages: [],
      });
    } catch (error) {
      handleVapiError(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const startInterviewWorkflow = async (questions?: string[]) => {
    try {
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
      handleVapiError(error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const stopCall = () => {
    vapi.stop();
  };

  return {
    startGenerateWorkflow,
    startInterviewWorkflow,
    stopCall,
  };
}