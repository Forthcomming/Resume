import { deepseekAuthHeaders } from "@/lib/ai/user-api-key";
import type { ResumeContent } from "@/lib/resume/content";
import type { JdCheckResult } from "@/types/jd-check";

export async function requestJdCheck(params: {
  content: ResumeContent;
  jobTitle: string;
  jobDescription: string;
}): Promise<JdCheckResult> {
  const res = await fetch("/api/resume/jd-check", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...deepseekAuthHeaders(),
    },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error ?? "JD 检查失败");
  }
  return data as JdCheckResult;
}
