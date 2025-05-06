// lib/vapi-adapter.ts
/**
 * This adapter connects the VAPI workflow to the API
 */
export async function handleVapiWorkflowCompletion(data: {
  role?: string;
  type?: string;
  level?: string;
  techstack?: string | string[];
  amount?: number;
  userid: string;
}) {
  // Set default values for any missing fields
  const payload = {
    role: data.role || "Frontend Developer",
    type: data.type || "mixed",
    level: data.level || "entry",
    techstack: data.techstack || "JavaScript,React",
    amount: data.amount || 5,
    userid: data.userid,
  };

  try {
    // Make the API call to our generate endpoint
    const response = await fetch("/api/vapi/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(`API Error: ${result.error}`);
    }

    return result;
  } catch (error) {
    throw error;
  }
}
