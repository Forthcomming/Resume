import type { Resume } from "@/types/resume";
import { DEMO_USER_ID } from "./schema";

/**
 * Local seed data mirroring the design mockup. Used as a fallback when
 * Supabase env is not configured, and as the source for SQL seeding.
 */
export const seedResumes: Resume[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    userId: DEMO_USER_ID,
    title: "字节跳动 · 产品经理",
    createdAt: "2024-06-18T00:00:00.000Z",
    updatedAt: "2024-06-18T00:00:00.000Z",
    sectionOrder: [],
    tags: ["产品", "互联网"],
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    userId: DEMO_USER_ID,
    title: "阿里巴巴 · 数据产品",
    createdAt: "2024-06-12T00:00:00.000Z",
    updatedAt: "2024-06-12T00:00:00.000Z",
    sectionOrder: [],
    tags: ["数据", "产品"],
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    userId: DEMO_USER_ID,
    title: "美团 · 用户增长",
    createdAt: "2024-06-05T00:00:00.000Z",
    updatedAt: "2024-06-05T00:00:00.000Z",
    sectionOrder: [],
    tags: ["增长", "互联网"],
  },
];
