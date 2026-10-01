import { deepseekAuthHeaders } from "@/lib/ai/user-api-key";
import type { ResumeContent } from "@/lib/resume/content";
import type { SectionSubVersionsStore } from "@/lib/resume/versions";
import type { JdAdaptationPlan } from "@/types/jd-tailoring";

export async function requestJdAdaptationPlan(params: {
  title: string;
  content: ResumeContent;
  versionStore: SectionSubVersionsStore;
  companyName: string;
  jobTitle: string;
  jobDescription: string;
}): Promise<JdAdaptationPlan> {
  const response = await fetch("/api/resume/jd-plan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...deepseekAuthHeaders(),
    },
    body: JSON.stringify(params),
  });
  const data = (await response.json()) as JdAdaptationPlan & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? "岗位适配失败");
  }
  return data;
}
