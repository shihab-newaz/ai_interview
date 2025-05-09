import React from "react";
import { redirect } from "next/navigation";

import { getInterviewById } from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import Agent from "@/components/Agent";

const InterviewPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const interview = await getInterviewById(id);
  const user = await getCurrentUser();

  if (!interview) {
    redirect("/");
  }

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <>
      {/* Interview Header */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <h2 className="capitalize">{interview.role} Interview</h2>
          <div className="flex items-center gap-3">
            <div className="bg-light-800 px-4 py-2 rounded-full">
              <p className="text-sm font-medium capitalize">{interview.type}</p>
            </div>
            <div className="bg-light-600 px-4 py-2 rounded-full">
              <p className="text-sm font-medium capitalize">{interview.level} Level</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Component (contains the interview UI) */}
      <Agent
        userName={user.name}
        userId={user.id}
        profileImage={user.profileURL}
        interviewId={id}
        // IMPORTANT: Change from "interview" to "practice" to match our condition
        type="practice" 
        questions={interview.questions}
      />
    </>
  );
};

export default InterviewPage;