import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui/button";

interface FeedbackErrorProps {
  message?: string;
  interviewId?: string;
}

const FeedbackError = ({
  message = "We couldn't generate feedback for your interview.",
  interviewId,
}: FeedbackErrorProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <Image
        src="/error.svg"
        alt="Error"
        width={120}
        height={120}
        className="opacity-70"
      />
      
      <h2 className="text-2xl font-semibold text-center">Feedback Unavailable</h2>
      
      <p className="text-center text-light-100 max-w-md">
        {message}
      </p>
      
      <div className="flex flex-wrap gap-4 justify-center mt-4">
        <Button asChild className="btn-primary">
          <Link href="/">Return to Dashboard</Link>
        </Button>
        
        {interviewId && (
          <Button asChild className="btn-secondary">
            <Link href={`/interview/${interviewId}`}>Retry Interview</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeedbackError;