import React from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { cn } from "@/lib/utils";
import DisplayTechIcons from "@/components/DisplayTechIcons";
import FeedbackError from "@/components/FeedbackError";

const FeedbackPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();
  const interview = await getInterviewById(id);

  if (!interview) {
    return <FeedbackError message="We couldn't find the interview you're looking for." />;
  }

  if (!user) {
    redirect("/sign-in");
  }

  const feedback = await getFeedbackByInterviewId({
    interviewId: interview.id,
    userId: user.id,
  });

  if (!feedback) {
    return (
      <FeedbackError 
        message="No feedback is available for this interview. Try taking the interview again." 
        interviewId={id}
      />
    );
  }

  // Validate feedback data is complete
  if (!feedback.totalScore || !feedback.categoryScores || !feedback.strengths || !feedback.areasForImprovement) {
    return (
      <FeedbackError 
        message="The feedback data for this interview is incomplete. Try taking the interview again."
        interviewId={id}
      />
    );
  }

  // Format the date of the interview
  const interviewDate = new Date(interview.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Helper function to get color class based on score
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return "bg-success-100";
    if (score >= 60) return "bg-primary-200";
    if (score >= 40) return "bg-light-400";
    return "bg-destructive-100";
  };

  return (
    <div className="section-feedback">
      <Toaster position="top-center" />

      {/* Interview Details Header */}
      <div className="flex flex-col gap-4 items-center text-center">
        <h2 className="text-3xl font-bold">Interview Feedback</h2>
        <p className="text-light-100">
          {interview.role} • {interview.level} Level • {interview.type} Interview
        </p>
        <div className="flex items-center gap-2">
          <Image src="/calendar.svg" width={20} height={20} alt="calendar" />
          <span className="text-light-100">{interviewDate}</span>
        </div>
        <DisplayTechIcons techStack={interview.techstack} />
      </div>

      {/* Overall Score Card */}
      <div className="card-border w-full">
        <div className="card p-8">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-2xl">Overall Score</h3>
            <div className="relative w-48 h-48 rounded-full border-8 border-dark-200 flex items-center justify-center">
              <span className="text-5xl font-bold text-primary-100">
                {Math.round(feedback.totalScore)}
              </span>
              <span className="text-2xl text-light-100">/100</span>
            </div>
            <p className="text-center max-w-lg">
              {feedback.finalAssessment?.split('. ')[0] || "Great effort on your interview!"}
            </p>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="card-border w-full">
        <div className="card p-8">
          <h3 className="text-2xl mb-6">Performance by Category</h3>
          <div className="flex flex-col gap-6">
            {feedback.categoryScores.map((category) => (
              <div key={category.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-light-100">{category.score}/100</span>
                </div>
                <div className="h-3 bg-dark-300 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", getScoreColorClass(category.score))}
                    style={{ width: `${category.score}%` }}
                  ></div>
                </div>
                <p className="text-sm text-light-400 mt-1">{category.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths and Areas for Improvement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="card-border w-full">
          <div className="card p-8">
            <h3 className="text-2xl mb-4 flex items-center gap-2">
              <Image src="/strengths.svg" width={24} height={24} alt="strengths" />
              Strengths
            </h3>
            <ul className="space-y-2">
              {feedback.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-success-100 text-xl">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Areas for Improvement */}
        <div className="card-border w-full">
          <div className="card p-8">
            <h3 className="text-2xl mb-4 flex items-center gap-2">
              <Image src="/improvement.svg" width={24} height={24} alt="improvement" />
              Areas for Improvement
            </h3>
            <ul className="space-y-2">
              {feedback.areasForImprovement.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-destructive-100 text-xl">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Final Assessment */}
      {feedback.finalAssessment && (
        <div className="card-border w-full">
          <div className="card p-8">
            <h3 className="text-2xl mb-4">Final Assessment</h3>
            <div className="space-y-4">
              {feedback.finalAssessment.split('. ').filter(Boolean).map((sentence, index) => (
                <p key={index}>{sentence.trim()}.</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="buttons mt-8">
        <Button asChild className="btn-primary">
          <Link href="/">Back to Dashboard</Link>
        </Button>
        <Button asChild className="btn-secondary">
          <Link href={`/interview/${interview.id}`}>Retake Interview</Link>
        </Button>
        <Button asChild className="btn-primary">
          <Link href="/interview">New Interview</Link>
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPage;